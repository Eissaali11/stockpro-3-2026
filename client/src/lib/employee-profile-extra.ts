export type EmployeeProfileExtraData = {
  nationalId?: string;
  phoneNumber?: string;
  birthDate?: string;
  nationalIdExpiryDate?: string;
  sponsorName?: string;
  licenseExpiryDate?: string;
  passportNumber?: string;
  passportExpiryDate?: string;
  nationality?: string;
  absherNumber?: string;
  qualification?: string;
  jobTitle?: string;
  employeeNumber?: string;
  projectName?: string;
  city?: string;
  carPlateNumber?: string;
  carType?: string;
  carModel?: string;
  carYear?: string;
  phoneType?: string;
  phoneSerial?: string;
  businessPhoneNumber?: string;
  simType?: string;
};

const STORAGE_PREFIX = "employee-profile-extra:";

export function getEmployeeProfileExtra(userId?: string | null): EmployeeProfileExtraData | null {
  if (!userId || typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as EmployeeProfileExtraData;
    return parsed;
  } catch {
    return null;
  }
}

export function setEmployeeProfileExtra(userId: string, data: EmployeeProfileExtraData): void {
  if (!userId || typeof window === "undefined") return;

  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(data));
  } catch {
    // ignore storage failures
  }
}
