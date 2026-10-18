import { useCallback, useState } from 'react'

import {
  COLLECTOR_FORM_FIELDS,
  EMPTY_COLLECTOR_FORM,
  validateCollectorForm,
  type CollectorFormErrors,
  type CollectorFormField,
  type CollectorFormValues,
} from './schema'

export interface CollectorFormValidation {
  ok: boolean
  /** Primeiro campo inválido, usado para levar o foco até ele. */
  firstField?: CollectorFormField
}

export function useCollectorForm() {
  const [values, setValues] = useState<CollectorFormValues>(
    EMPTY_COLLECTOR_FORM,
  )
  const [errors, setErrors] = useState<CollectorFormErrors>({})
  const [validated, setValidated] = useState(false)

  const setField = useCallback(
    <K extends keyof CollectorFormValues>(
      field: K,
      value: CollectorFormValues[K],
    ) => {
      setValues((previous) => ({ ...previous, [field]: value }))
      setErrors((previous) => {
        if (!(field in previous)) return previous
        const next = { ...previous }
        delete next[field as CollectorFormField]
        return next
      })
      setValidated(false)
    },
    [],
  )

  const validate = useCallback((): CollectorFormValidation => {
    const next = validateCollectorForm(values)
    setErrors(next)

    const firstField = COLLECTOR_FORM_FIELDS.find((field) => next[field])
    if (firstField) {
      setValidated(false)
      return { ok: false, firstField }
    }

    setValidated(true)
    return { ok: true }
  }, [values])

  return { values, errors, validated, setField, validate }
}
