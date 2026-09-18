import { EMPTY_DRAFT, type RunnerDraft } from "../types";

export const REGISTRATION_DRAFT_KEY = "multitrack.tbb.registration-draft";

const IDB_NAME = "multitrack.tbb.registration-draft";
const IDB_STORE = "files";

export const REGISTRATION_FILE_KEYS = ["identityFile", "medicalFile", "parentalFile"] as const;

export type RegistrationFileKey = (typeof REGISTRATION_FILE_KEYS)[number];

const FILE_KEYS = REGISTRATION_FILE_KEYS;

type FileKey = RegistrationFileKey;

type StoredFields = {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  courseId: number | "";
  race: string;
  tshirtSize: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

export type RegistrationDraftState = {
  wizardOpen: boolean;
  step: number;
  rulesAccepted: boolean;
  draft: RunnerDraft;
};

export type RegistrationDraftSnapshot = RegistrationDraftState & {
  /**
   * Fichiers dont le nom a été retenu mais dont le contenu n’a pas pu être
   * relu (IndexedDB indisponible) : l’utilisateur doit les re-sélectionner.
   */
  missingFileNames: Partial<Record<RegistrationFileKey, string>>;
};

type StoredPayload = {
  version: 1;
  wizardOpen: boolean;
  step: number;
  rulesAccepted: boolean;
  fields: StoredFields;
  fileNames?: Partial<Record<FileKey, string>>;
};

function fieldsFromDraft(draft: RunnerDraft): StoredFields {
  return {
    firstName: draft.firstName,
    lastName: draft.lastName,
    birthDate: draft.birthDate,
    gender: draft.gender,
    courseId: draft.courseId,
    race: draft.race,
    tshirtSize: draft.tshirtSize,
    emergencyContactName: draft.emergencyContactName,
    emergencyContactPhone: draft.emergencyContactPhone,
  };
}

function draftFromFields(fields: StoredFields, files: Pick<RunnerDraft, FileKey>): RunnerDraft {
  return {
    ...EMPTY_DRAFT,
    ...fields,
    identityFile: files.identityFile,
    medicalFile: files.medicalFile,
    parentalFile: files.parentalFile,
  };
}

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB indisponible"));
  });
}

function runTransaction<T>(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => T,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, mode);
    let result: T;
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB indisponible"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB interrompu"));
    result = run(tx.objectStore(IDB_STORE));
  });
}

function asFile(value: unknown, fallbackName: string): File | null {
  if (value instanceof File) return value;
  if (value instanceof Blob) {
    return new File([value], fallbackName, { type: value.type });
  }
  return null;
}

async function readFiles(names: Partial<Record<FileKey, string>>): Promise<Pick<RunnerDraft, FileKey>> {
  try {
    const db = await openDraftDb();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readonly");
        const store = tx.objectStore(IDB_STORE);
        const identityReq = store.get("identityFile");
        const medicalReq = store.get("medicalFile");
        const parentalReq = store.get("parentalFile");
        tx.oncomplete = () => {
          resolve({
            identityFile: asFile(identityReq.result, names.identityFile ?? "piece-identite"),
            medicalFile: asFile(medicalReq.result, names.medicalFile ?? "certificat-medical"),
            parentalFile: asFile(parentalReq.result, names.parentalFile ?? "autorisation-parentale"),
          });
        };
        tx.onerror = () => reject(tx.error ?? new Error("IndexedDB indisponible"));
      });
    } finally {
      db.close();
    }
  } catch {
    return { identityFile: null, medicalFile: null, parentalFile: null };
  }
}

async function writeFiles(draft: RunnerDraft): Promise<void> {
  const db = await openDraftDb();
  try {
    await runTransaction(db, "readwrite", (store) => {
      for (const key of FILE_KEYS) {
        const file = draft[key];
        if (file) store.put(file, key);
        else store.delete(key);
      }
    });
  } finally {
    db.close();
  }
}

function readPayload(): StoredPayload | null {
  try {
    const raw = localStorage.getItem(REGISTRATION_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPayload;
    if (!parsed || parsed.version !== 1 || !parsed.fields) return null;
    return parsed;
  } catch {
    return null;
  }
}

function fileNamesFromDraft(draft: RunnerDraft): Partial<Record<FileKey, string>> {
  const names: Partial<Record<FileKey, string>> = {};
  for (const key of FILE_KEYS) {
    if (draft[key]?.name) names[key] = draft[key]!.name;
  }
  return names;
}

export async function loadRegistrationDraft(): Promise<RegistrationDraftSnapshot | null> {
  const payload = readPayload();
  if (!payload) return null;
  const names = payload.fileNames ?? {};
  const files = await readFiles(names);
  const missingFileNames: Partial<Record<FileKey, string>> = {};
  for (const key of FILE_KEYS) {
    const name = names[key];
    if (name && !files[key]) missingFileNames[key] = name;
  }
  return {
    wizardOpen: payload.wizardOpen === true,
    step: payload.step >= 1 && payload.step <= 3 ? payload.step : 1,
    rulesAccepted: payload.rulesAccepted === true,
    draft: draftFromFields(payload.fields, files),
    missingFileNames,
  };
}

export async function saveRegistrationDraft(state: RegistrationDraftState): Promise<void> {
  const payload: StoredPayload = {
    version: 1,
    wizardOpen: state.wizardOpen,
    step: state.step,
    rulesAccepted: state.rulesAccepted,
    fields: fieldsFromDraft(state.draft),
    fileNames: fileNamesFromDraft(state.draft),
  };
  localStorage.setItem(REGISTRATION_DRAFT_KEY, JSON.stringify(payload));
}

export async function saveRegistrationDraftFiles(draft: RunnerDraft): Promise<void> {
  try {
    await writeFiles(draft);
  } catch {
    // Les champs restent en localStorage même si IndexedDB est indisponible.
  }
}

export async function clearRegistrationDraft(): Promise<void> {
  localStorage.removeItem(REGISTRATION_DRAFT_KEY);
  try {
    const db = await openDraftDb();
    try {
      await runTransaction(db, "readwrite", (store) => {
        store.clear();
      });
    } finally {
      db.close();
    }
  } catch {
    // Le localStorage est déjà vidé.
  }
}
