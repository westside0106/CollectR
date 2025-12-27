'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'

type CollectionRole = 'viewer' | 'editor' | 'admin'

interface Member {
  id: string
  user_id: string
  role: CollectionRole
  created_at: string
  user_email?: string
}

interface Invitation {
  id: string
  invited_email: string | null
  invite_token: string
  role: CollectionRole
  expires_at: string
  created_at: string
}

interface ShareModalProps {
  collectionId: string
  collectionName: string
  isOwner: boolean
  onClose: () => void
}

const ROLE_LABELS: Record<CollectionRole, string> = {
  viewer: 'Betrachter',
  editor: 'Bearbeiter',
  admin: 'Admin'
}

const ROLE_DESCRIPTIONS: Record<CollectionRole, string> = {
  viewer: 'Kann Items ansehen',
  editor: 'Kann Items hinzufügen, bearbeiten, löschen',
  admin: 'Voller Zugriff + kann weitere einladen'
}

export function ShareModal({ collectionId, collectionName, isOwner, onClose }: ShareModalProps) {
  const supabase = createClient()
  const { showToast } = useToast()

  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // Einladungs-Form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<CollectionRole>('viewer')
  const [showLinkMode, setShowLinkMode] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [collectionId])

  async function loadData() {
    setLoading(true)

    // Mitglieder laden
    const { data: membersData } = await supabase
      .from('collection_members')
      .select('*')
      .eq('collection_id', collectionId)
      .order('created_at')

    if (membersData) {
      // E-Mails für Mitglieder holen (nur wenn Owner/Admin)
      const userIds = membersData.map(m => m.user_id)
      // Hinweis: In Produktion sollte dies über eine Edge Function gehen
      // da auth.users nicht direkt abfragbar ist
      setMembers(membersData.map(m => ({
        ...m,
        user_email: m.user_id.slice(0, 8) + '...' // Placeholder
      })))
    }

    // Offene Einladungen laden
    const { data: invitationsData } = await supabase
      .from('collection_invitations')
      .select('*')
      .eq('collection_id', collectionId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (invitationsData) {
      setInvitations(invitationsData)
    }

    setLoading(false)
  }

  async function createInvitation(byEmail: boolean) {
    if (byEmail && !inviteEmail.trim()) {
      showToast('Bitte E-Mail eingeben', 'error')
      return
    }

    setCreating(true)

    const { data, error } = await supabase
      .from('collection_invitations')
      .insert({
        collection_id: collectionId,
        invited_email: byEmail ? inviteEmail.trim().toLowerCase() : null,
        role: inviteRole,
        invited_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single()

    if (error) {
      showToast('Fehler beim Erstellen der Einladung', 'error')
      console.error(error)
    } else if (data) {
      const inviteUrl = `${window.location.origin}/invite/${data.invite_token}`

      if (byEmail) {
        // TODO: E-Mail-Versand implementieren (Edge Function)
        showToast('Einladung erstellt! (E-Mail-Versand noch nicht implementiert)')
        setInviteEmail('')
      } else {
        setGeneratedLink(inviteUrl)
        showToast('Einladungs-Link erstellt!')
      }

      loadData()
    }

    setCreating(false)
  }

  async function copyInviteLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`
    await navigator.clipboard.writeText(url)
    showToast('Link kopiert!')
  }

  async function deleteInvitation(id: string) {
    const { error } = await supabase
      .from('collection_invitations')
      .delete()
      .eq('id', id)

    if (!error) {
      setInvitations(prev => prev.filter(i => i.id !== id))
      showToast('Einladung gelöscht')
    }
  }

  async function removeMember(memberId: string) {
    const { error } = await supabase
      .from('collection_members')
      .delete()
      .eq('id', memberId)

    if (!error) {
      setMembers(prev => prev.filter(m => m.id !== memberId))
      showToast('Mitglied entfernt')
    }
  }

  async function updateMemberRole(memberId: string, newRole: CollectionRole) {
    const { error } = await supabase
      .from('collection_members')
      .update({ role: newRole })
      .eq('id', memberId)

    if (!error) {
      setMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, role: newRole } : m
      ))
      showToast('Rolle aktualisiert')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold dark:text-white">Sammlung teilen</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{collectionName}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Einladung erstellen */}
          <div>
            <h3 className="font-semibold mb-3 dark:text-white">Personen einladen</h3>

            {/* Tab-Auswahl */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setShowLinkMode(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  !showLinkMode
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Per E-Mail
              </button>
              <button
                onClick={() => setShowLinkMode(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  showLinkMode
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Per Link
              </button>
            </div>

            {/* Rollen-Auswahl */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Berechtigung
              </label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as CollectionRole)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
              >
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <option key={role} value={role}>
                    {label} - {ROLE_DESCRIPTIONS[role as CollectionRole]}
                  </option>
                ))}
              </select>
            </div>

            {!showLinkMode ? (
              // E-Mail Einladung
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="email@beispiel.de"
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                />
                <button
                  onClick={() => createInvitation(true)}
                  disabled={creating || !inviteEmail.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {creating ? '...' : 'Einladen'}
                </button>
              </div>
            ) : (
              // Link Einladung
              <div>
                {generatedLink ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={generatedLink}
                        readOnly
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-white text-sm font-mono"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedLink)
                          showToast('Link kopiert!')
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        Kopieren
                      </button>
                    </div>
                    <button
                      onClick={() => setGeneratedLink(null)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Neuen Link erstellen
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => createInvitation(false)}
                    disabled={creating}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {creating ? 'Erstelle...' : 'Einladungs-Link erstellen'}
                  </button>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Der Link ist 7 Tage gültig und kann von jeder Person mit Account genutzt werden.
                </p>
              </div>
            )}
          </div>

          {/* Aktuelle Mitglieder */}
          {members.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 dark:text-white">
                Mitglieder ({members.length})
              </h3>
              <div className="space-y-2">
                {members.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium text-sm">
                        {member.user_email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="text-sm font-medium dark:text-white">
                          {member.user_email}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {ROLE_LABELS[member.role]}
                        </div>
                      </div>
                    </div>
                    {isOwner && (
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={e => updateMemberRole(member.id, e.target.value as CollectionRole)}
                          className="text-sm px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
                        >
                          {Object.entries(ROLE_LABELS).map(([role, label]) => (
                            <option key={role} value={role}>{label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeMember(member.id)}
                          className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition"
                          title="Entfernen"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offene Einladungen */}
          {invitations.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 dark:text-white">
                Offene Einladungen ({invitations.length})
              </h3>
              <div className="space-y-2">
                {invitations.map(invitation => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                  >
                    <div>
                      <div className="text-sm font-medium dark:text-white">
                        {invitation.invited_email || 'Link-Einladung'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {ROLE_LABELS[invitation.role]} • Läuft ab am {new Date(invitation.expires_at).toLocaleDateString('de')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyInviteLink(invitation.invite_token)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition"
                        title="Link kopieren"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteInvitation(invitation.id)}
                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition"
                        title="Löschen"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              Laden...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  )
}
