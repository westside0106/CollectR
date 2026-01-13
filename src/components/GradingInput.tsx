'use client'

import { useState } from 'react'

export interface GradingValue {
  company: 'PSA' | 'BGS' | 'CGC' | 'SGC' | 'RAW' | ''
  grade: string // z.B. "10", "9.5", "BGS 9.5 (9.5/10/9.5/9)"
  certNumber: string
}

interface GradingInputProps {
  value?: GradingValue | string | null
  onChange: (value: GradingValue) => void
  required?: boolean
  className?: string
}

const GRADING_COMPANIES = [
  { value: '', label: '-- Keine/RAW --', color: '#94a3b8' },
  { value: 'PSA', label: 'PSA', color: '#ef4444' },
  { value: 'BGS', label: 'BGS (Beckett)', color: '#3b82f6' },
  { value: 'CGC', label: 'CGC', color: '#f97316' },
  { value: 'SGC', label: 'SGC', color: '#22c55e' },
] as const

const PSA_GRADES = [
  { value: '10', label: 'PSA 10 - Gem Mint' },
  { value: '9', label: 'PSA 9 - Mint' },
  { value: '8', label: 'PSA 8 - NM-MT' },
  { value: '7', label: 'PSA 7 - Near Mint' },
  { value: '6', label: 'PSA 6 - Excellent-MT' },
  { value: '5', label: 'PSA 5 - Excellent' },
  { value: '4', label: 'PSA 4 - Very Good-Excellent' },
  { value: '3', label: 'PSA 3 - Very Good' },
  { value: '2', label: 'PSA 2 - Good' },
  { value: '1', label: 'PSA 1 - Poor' },
]

const BGS_GRADES = [
  { value: '10', label: 'BGS 10 - Pristine' },
  { value: '9.5', label: 'BGS 9.5 - Gem Mint' },
  { value: '9', label: 'BGS 9 - Mint' },
  { value: '8.5', label: 'BGS 8.5 - NM-MT+' },
  { value: '8', label: 'BGS 8 - NM-MT' },
  { value: '7.5', label: 'BGS 7.5 - Near Mint+' },
  { value: '7', label: 'BGS 7 - Near Mint' },
  { value: '6.5', label: 'BGS 6.5 - Excellent-MT+' },
  { value: '6', label: 'BGS 6 - Excellent-MT' },
  { value: '5.5', label: 'BGS 5.5 - Excellent+' },
  { value: '5', label: 'BGS 5 - Excellent' },
]

const CGC_GRADES = [
  { value: '10', label: 'CGC 10 - Pristine' },
  { value: '9.5', label: 'CGC 9.5 - Gem Mint' },
  { value: '9', label: 'CGC 9 - Mint' },
  { value: '8.5', label: 'CGC 8.5 - NM/Mint+' },
  { value: '8', label: 'CGC 8 - NM/Mint' },
  { value: '7.5', label: 'CGC 7.5 - Near Mint+' },
  { value: '7', label: 'CGC 7 - Near Mint' },
  { value: '6.5', label: 'CGC 6.5 - Excellent-MT+' },
  { value: '6', label: 'CGC 6 - Excellent-MT' },
  { value: '5.5', label: 'CGC 5.5 - Excellent+' },
  { value: '5', label: 'CGC 5 - Excellent' },
]

const SGC_GRADES = [
  { value: '10', label: 'SGC 10 - Gem Mint' },
  { value: '9.5', label: 'SGC 9.5 - Mint+' },
  { value: '9', label: 'SGC 9 - Mint' },
  { value: '8.5', label: 'SGC 8.5 - NM-MT+' },
  { value: '8', label: 'SGC 8 - NM-MT' },
  { value: '7.5', label: 'SGC 7.5 - Near Mint+' },
  { value: '7', label: 'SGC 7 - Near Mint' },
  { value: '6', label: 'SGC 6 - Excellent-MT' },
  { value: '5', label: 'SGC 5 - Excellent' },
]

export default function GradingInput({ value, onChange, required, className = '' }: GradingInputProps) {
  // Parse existing value
  const parseValue = (val: GradingValue | string | null | undefined): GradingValue => {
    if (!val) return { company: '', grade: '', certNumber: '' }

    if (typeof val === 'string') {
      // Parse old format: "PSA 10" or "BGS 9.5"
      const match = val.match(/^(PSA|BGS|CGC|SGC)\s+(.+)$/i)
      if (match) {
        return {
          company: match[1].toUpperCase() as any,
          grade: match[2],
          certNumber: ''
        }
      }
      return { company: '', grade: val, certNumber: '' }
    }

    return val
  }

  const currentValue = parseValue(value)
  const [company, setCompany] = useState<GradingValue['company']>(currentValue.company || '')
  const [grade, setGrade] = useState(currentValue.grade || '')
  const [certNumber, setCertNumber] = useState(currentValue.certNumber || '')

  const handleCompanyChange = (newCompany: GradingValue['company']) => {
    setCompany(newCompany)
    setGrade('') // Reset grade when company changes
    onChange({ company: newCompany, grade: '', certNumber })
  }

  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade)
    onChange({ company, grade: newGrade, certNumber })
  }

  const handleCertNumberChange = (newCert: string) => {
    setCertNumber(newCert)
    onChange({ company, grade, certNumber: newCert })
  }

  const getGradeOptions = () => {
    switch (company) {
      case 'PSA': return PSA_GRADES
      case 'BGS': return BGS_GRADES
      case 'CGC': return CGC_GRADES
      case 'SGC': return SGC_GRADES
      default: return []
    }
  }

  const selectedCompany = GRADING_COMPANIES.find(c => c.value === company)

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Grading Company */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
          Grading-Anbieter
        </label>
        <select
          value={company}
          onChange={(e) => handleCompanyChange(e.target.value as GradingValue['company'])}
          required={required}
          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {GRADING_COMPANIES.map((comp) => (
            <option key={comp.value} value={comp.value}>
              {comp.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grade (only if company selected) */}
      {company && company !== 'RAW' && (
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Grade
          </label>
          <select
            value={grade}
            onChange={(e) => handleGradeChange(e.target.value)}
            required={required && !!company}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            style={selectedCompany ? { borderLeftColor: selectedCompany.color, borderLeftWidth: '4px' } : undefined}
          >
            <option value="">-- Grade auswählen --</option>
            {getGradeOptions().map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Cert Number (only if company selected) */}
      {company && company !== 'RAW' && (
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Zertifikatsnummer (optional)
          </label>
          <input
            type="text"
            value={certNumber}
            onChange={(e) => handleCertNumberChange(e.target.value)}
            placeholder="z.B. 12345678"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
          />
        </div>
      )}

      {/* Preview */}
      {company && grade && (
        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedCompany?.color }}
            />
            <span className="text-sm font-semibold dark:text-white">
              {company} {grade}
            </span>
            {certNumber && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                #{certNumber}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
