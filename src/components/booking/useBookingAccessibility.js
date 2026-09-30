'use client';
import { useEffect, useId, useRef } from 'react';

// Associate repeated manifest controls with their visible labels. IDs are unique
// per mounted wizard, including the repeated room and infant rows.
export default function useBookingAccessibility(step) {
  const root = useRef(null);
  const prefix = useId();
  const serial = useRef(0);
  useEffect(() => {
    const form = root.current;
    if (!form) return;
    const labelFields = () => {
      form.querySelectorAll('input, select, textarea').forEach((control, i) => {
        if (!control.id) control.id = `${prefix}-field-${++serial.current}`;
        let parent = control.parentElement;
        while (parent && parent !== form) {
          const labels = parent.querySelectorAll('label');
          const fields = parent.querySelectorAll('input,select,textarea');
          if (labels.length === 1 && fields.length === 1) {
            labels[0].htmlFor = control.id;
            if (labels[0].textContent.includes('*')) control.required = true;
            break;
          }
          parent = parent.parentElement;
        }
      });
    };
    labelFields();
    const observer = new MutationObserver(labelFields);
    observer.observe(form, { childList: true, subtree: true });
    const heading = form.querySelector('[data-step-heading]');
    heading?.focus();
    return () => observer.disconnect();
  }, [step, prefix]);
  return root;
}
