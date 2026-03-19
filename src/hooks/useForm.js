import { useState, useCallback, useRef } from 'react';
import { validators, validationMessages } from '../config';

// ─── HOOK: walidacja formularzy ───────────────────────────────────────────────
// FIX: initialValues przechowywane w ref żeby reset() nie powodował nieskończonej pętli
export function useForm(initialValues, rules) {
  const initialRef            = useRef(initialValues);
  const rulesRef              = useRef(rules);
  rulesRef.current            = rules; // zawsze aktualny obiekt reguł

  const [values, setValues]   = useState(initialValues);
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});

  // FIX: touched jako ref żeby uniknąć closure w set()
  const touchedRef = useRef({});

  const set = useCallback((key, value) => {
    setValues(v => ({ ...v, [key]: value }));
    // Waliduj na bieżąco tylko jeśli pole było już dotknięte
    if (touchedRef.current[key]) {
      const rule = rulesRef.current[key];
      if (rule !== undefined) {
        const err = validateField(key, value, rule);
        setErrors(e => ({ ...e, [key]: err }));
      }
    }
  }, []); // stabilna referencja — nie zmienia się

  const touch = useCallback((key) => {
    touchedRef.current = { ...touchedRef.current, [key]: true };
    setTouched(t => ({ ...t, [key]: true }));
    setValues(v => {
      const rule = rulesRef.current[key];
      if (rule !== undefined) {
        const err = validateField(key, v[key], rule);
        setErrors(e => ({ ...e, [key]: err }));
      }
      return v; // brak zmiany values
    });
  }, []);

  /** Waliduje wszystkie pola, zwraca true jeśli brak błędów */
  const validate = useCallback(() => {
    const currentRules = rulesRef.current;
    let valid = true;
    const newErrors = {};
    const newTouched = {};

    setValues(currentValues => {
      Object.entries(currentRules).forEach(([key, rule]) => {
        newTouched[key] = true;
        const err = validateField(key, currentValues[key], rule);
        if (err) { newErrors[key] = err; valid = false; }
      });
      return currentValues;
    });

    touchedRef.current = { ...touchedRef.current, ...newTouched };
    setTouched(t => ({ ...t, ...newTouched }));
    setErrors(newErrors);
    return valid;
  }, []);

  const reset = useCallback((newValues) => {
    const vals = newValues ?? initialRef.current;
    setValues(vals);
    setErrors({});
    setTouched({});
    touchedRef.current = {};
  }, []);

  /** Ustaw wiele pól naraz (np. przy wczytaniu danych z bazy) */
  const setAll = useCallback((newValues) => {
    setValues(v => ({ ...v, ...newValues }));
  }, []);

  return { values, errors, touched, set, setAll, touch, validate, reset };
}

// ─── WALIDACJA POLA ───────────────────────────────────────────────────────────
function validateField(key, value, rule) {
  // Funkcja walidująca — zwraca true jeśli OK
  if (typeof rule === "function") {
    return rule(value) ? null : (validationMessages[key] || "Nieprawidłowa wartość");
  }
  // Tablica reguł — każda może być funkcją lub obiektem {validator, message}
  if (Array.isArray(rule)) {
    for (const r of rule) {
      if (typeof r === "function" && !r(value)) {
        return validationMessages[key] || "Nieprawidłowa wartość";
      }
      if (typeof r === "object" && r !== null && r.validator && !r.validator(value)) {
        return r.message || "Nieprawidłowa wartość";
      }
    }
    return null;
  }
  // Skrót: true = pole wymagane
  if (rule === true) {
    return validators.required(value) ? null : "To pole jest wymagane";
  }
  return null;
}

// ─── GOTOWE REGUŁY WALIDACJI ──────────────────────────────────────────────────
export const formRules = {
  loginEmail:       validators.email,
  loginPassword:    validators.required,
  registerName:     validators.name,
  registerEmail:    validators.email,
  registerPassword: validators.password,
  aptName:          validators.name,
  aptDate:          validators.required,
  orgName:          validators.name,
  orgSlug:          validators.slug,
};
