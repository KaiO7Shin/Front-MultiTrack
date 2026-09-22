import { useCallback, useEffect, useRef, useState } from "react";
import {
  REGISTRATION_FILE_KEYS,
  clearRegistrationDraft,
  loadRegistrationDraft,
  saveRegistrationDraft,
  saveRegistrationDraftFiles,
  type RegistrationFileKey,
} from "../lib/registrationDraftStorage";
import { EMPTY_DRAFT, type RunnerDraft } from "../types";

export type MissingFileNames = Partial<Record<RegistrationFileKey, string>>;

export function useRegistrationDraft() {
  const [hydrated, setHydrated] = useState(false);
  const [wizardOpen, setWizardOpenState] = useState(false);
  const [step, setStep] = useState(1);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [draft, setDraft] = useState<RunnerDraft>(EMPTY_DRAFT);
  const [missingFileNames, setMissingFileNames] = useState<MissingFileNames>({});
  const persistEnabled = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadRegistrationDraft()
      .then((saved) => {
        if (cancelled || !saved) return;
        setWizardOpenState(saved.wizardOpen);
        setStep(saved.step);
        setRulesAccepted(saved.rulesAccepted);
        setDraft(saved.draft);
        setMissingFileNames(saved.missingFileNames);
      })
      .finally(() => {
        if (!cancelled) {
          persistEnabled.current = true;
          setHydrated(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !persistEnabled.current) return;
    const timer = window.setTimeout(() => {
      if (!persistEnabled.current) return;
      void saveRegistrationDraft({ wizardOpen, step, rulesAccepted, draft });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [hydrated, wizardOpen, step, rulesAccepted, draft]);

  const identityFile = draft.identityFile;
  const medicalFile = draft.medicalFile;
  const parentalFile = draft.parentalFile;

  useEffect(() => {
    if (!hydrated || !persistEnabled.current) return;
    void saveRegistrationDraftFiles({
      ...EMPTY_DRAFT,
      identityFile,
      medicalFile,
      parentalFile,
    });
  }, [hydrated, identityFile, medicalFile, parentalFile]);

  useEffect(() => {
    const files = { identityFile, medicalFile, parentalFile };
    setMissingFileNames((current) => {
      const resolved = REGISTRATION_FILE_KEYS.filter((key) => files[key] && current[key]);
      if (resolved.length === 0) return current;
      const next = { ...current };
      for (const key of resolved) delete next[key];
      return next;
    });
  }, [identityFile, medicalFile, parentalFile]);

  const setWizardOpen = useCallback((open: boolean) => {
    persistEnabled.current = true;
    setWizardOpenState(open);
  }, []);

  const clearDraft = useCallback(async () => {
    persistEnabled.current = false;
    await clearRegistrationDraft();
    setWizardOpenState(false);
    setStep(1);
    setRulesAccepted(false);
    setDraft(EMPTY_DRAFT);
    setMissingFileNames({});
  }, []);

  return {
    hydrated,
    wizardOpen,
    setWizardOpen,
    step,
    setStep,
    rulesAccepted,
    setRulesAccepted,
    draft,
    setDraft,
    missingFileNames,
    clearDraft,
  };
}
