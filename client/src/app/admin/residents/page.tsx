"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { FormEvent, ChangeEvent } from "react";
import type { Resident } from "@/lib/types";
import { residentsApi, uploadImageUrl } from "@/services/api";
import { PageHeader } from "@/components/admin/PageHeader";
import { MaterialIcon } from "@/components/admin/MaterialIcon";

// Maps every API row (which now carries the full resident profile from
// Neon PostgreSQL) onto the local Resident type with safe fallbacks.
function mapApiResident(r: Resident): Resident {
  return {
    id: String(r.id ?? ""),
    firstName: r.firstName ?? "",
    middleName: r.middleName ?? "",
    lastName: r.lastName ?? "",
    suffix: r.suffix ?? "",
    fullName: r.fullName ?? "Unnamed Resident",
    birthdate: r.birthdate ?? "",
    birthPlace: r.birthPlace ?? "",
    age: Number(r.age) || 0,
    gender: r.gender ?? "",
    civilStatus: r.civilStatus ?? "",
    nationality: r.nationality ?? "",
    religion: r.religion ?? "",
    occupation: r.occupation ?? "",
    address: r.address ?? "",
    contactNumber: r.contactNumber ?? "",
    email: r.email ?? "",
    pwdIdNo: r.pwdIdNo ?? "",
    familyMonthlyIncome: r.familyMonthlyIncome ?? "",
    indigent: r.indigent ?? "",
    registeredVoter: r.registeredVoter ?? "",
    precinctNo: r.precinctNo ?? "",
    voterIdNo: r.voterIdNo ?? "",
    photoUrl: r.photoUrl ?? "",
    householdNumber: r.householdNumber ?? "",
    emergencyContact: r.emergencyContact ?? "",
    dateRegistered: r.dateRegistered ?? "",
    userId: r.userId ?? null,
    isRegistered: Boolean(r.isRegistered),
  };
}

const emptyFormData = {
  id: "",
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "Select",
  gender: "Male",
  birthdate: "",
  birthPlace: "",
  age: "",
  civilStatus: "Single",
  nationality: "Filipino",
  religion: "",
  occupation: "",
  contactNumber: "",
  email: "",
  address: "",
  householdNumber: "",
  emergencyContact: "",
  pwdIdNo: "",
  familyMonthlyIncome: "Select Range",
  indigent: "No",
  registeredVoter: "Yes",
  precinctNo: "",
  voterIdNo: "",
  photoUrl: "",
};

function apiErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const response = (err as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === "string" && response.data.message) {
      return response.data.message;
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

type FormData = typeof emptyFormData;

function splitFullName(fullName: string): { first: string; last: string } {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export default function ResidentsPage() {
  const [residentList, setResidentList] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Resident | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Manage Details modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  // A newly picked photo file, uploaded to the server on save.
  // formData.photoUrl holds the preview (blob:) or the stored path.
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Search + filters (client-side over the server-fetched list)
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "REGISTERED" | "NOT_REGISTERED">("ALL");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadResidents = async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    try {
      const rows = await residentsApi.getAll();
      setResidentList((Array.isArray(rows) ? rows : []).map(mapApiResident));
      setLoadError(null);
    } catch (err) {
      setLoadError(apiErrorMessage(err, "Failed to load residents."));
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await loadResidents(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-dismiss the success notice after a few seconds.
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const filteredResidents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return residentList.filter((r) => {
      if (statusFilter === "REGISTERED" && !r.isRegistered) return false;
      if (statusFilter === "NOT_REGISTERED" && r.isRegistered) return false;
      if (!q) return true;
      return [r.fullName, r.id, r.address, r.contactNumber, r.email, r.householdNumber]
        .some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [residentList, search, statusFilter]);

  const registeredCount = useMemo(
    () => residentList.filter((r) => r.isRegistered).length,
    [residentList]
  );

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData(emptyFormData);
    setPhotoFile(null);
    setSaveError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (resident: Resident) => {
    setIsEditing(true);
    setSaveError(null);
    setPhotoFile(null);
    const split = splitFullName(resident.fullName);
    setFormData({
      id: resident.id,
      firstName: resident.firstName || split.first,
      middleName: resident.middleName || "",
      lastName: resident.lastName || split.last,
      suffix: resident.suffix || "Select",
      gender: resident.gender || "Male",
      birthdate: resident.birthdate || "",
      birthPlace: resident.birthPlace || "",
      age: resident.age !== undefined && resident.age !== null ? String(resident.age) : "",
      civilStatus: resident.civilStatus || "Single",
      nationality: resident.nationality || "Filipino",
      religion: resident.religion || "",
      occupation: resident.occupation || "",
      contactNumber: resident.contactNumber || "",
      email: resident.email || "",
      address: resident.address || "",
      householdNumber: resident.householdNumber || "",
      emergencyContact: resident.emergencyContact || "",
      pwdIdNo: resident.pwdIdNo || "",
      familyMonthlyIncome: resident.familyMonthlyIncome || "Select Range",
      indigent: resident.indigent || "No",
      registeredVoter: resident.registeredVoter || "Yes",
      precinctNo: resident.precinctNo || "",
      voterIdNo: resident.voterIdNo || "",
      photoUrl: resident.photoUrl || "",
    });
    setModalOpen(true);
  };

  const handleView = (resident: Resident) => {
    setSelected(resident);
    setDrawerOpen(true);
  };

  const handleBirthdateChange = (dateVal: string) => {
    let calculatedAge = "";
    if (dateVal) {
      const birth = new Date(dateVal);
      const today = new Date();
      let ageNum = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        ageNum--;
      }
      if (!isNaN(ageNum) && ageNum >= 0) {
        calculatedAge = String(ageNum);
      }
    }
    setFormData((prev) => ({
      ...prev,
      birthdate: dateVal,
      age: calculatedAge || prev.age,
    }));
  };

  const handlePhotoBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, photoUrl: url }));
    }
  };

  // Builds the full DB-backed payload. Placeholder select values
  // ("Select" / "Select Range") are stored as empty strings.
  // The photo is handled separately: pass the stored path through, or
  // the freshly uploaded path via the photoUrlOverride.
  const buildPayload = (photoUrlOverride?: string): Partial<Resident> => {
    const constructedFullName =
      [formData.firstName, formData.middleName, formData.lastName]
        .filter(Boolean)
        .join(" ") || "Unnamed Resident";
    const constructedAddress =
      formData.address ||
      (formData.birthPlace ? `Brgy. San Jose, ${formData.birthPlace}` : "Brgy. San Jose");
    const rawPhoto = photoUrlOverride ?? formData.photoUrl;
    // A blob: URL is only a local preview — never persist it.
    const photo = rawPhoto && rawPhoto.startsWith("blob:") ? undefined : rawPhoto;
    return {
      fullName: constructedFullName,
      firstName: formData.firstName,
      middleName: formData.middleName,
      lastName: formData.lastName,
      suffix: formData.suffix === "Select" ? "" : formData.suffix,
      birthdate: formData.birthdate,
      birthPlace: formData.birthPlace,
      age: formData.age === "" ? undefined : Number(formData.age),
      gender: formData.gender,
      civilStatus: formData.civilStatus,
      nationality: formData.nationality,
      religion: formData.religion,
      occupation: formData.occupation,
      address: constructedAddress,
      contactNumber: formData.contactNumber,
      email: formData.email,
      householdNumber: formData.householdNumber,
      emergencyContact: formData.emergencyContact,
      pwdIdNo: formData.pwdIdNo,
      familyMonthlyIncome:
        formData.familyMonthlyIncome === "Select Range" ? "" : formData.familyMonthlyIncome,
      indigent: formData.indigent,
      registeredVoter: formData.registeredVoter,
      precinctNo: formData.precinctNo,
      voterIdNo: formData.voterIdNo,
      photoUrl: photo,
    };
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveError(null);

    try {
      if (isEditing && formData.id) {
        // Update the existing resident by its real database ID.
        // Never POST here — that would create a duplicate record.
        let photoUrl: string | undefined;
        if (photoFile) {
          // Upload the new photo first so its stored path is saved
          // together with the rest of the update.
          const uploaded = await residentsApi.uploadPhoto(formData.id, photoFile);
          photoUrl = uploaded.photoUrl || undefined;
        }
        await residentsApi.update(formData.id, buildPayload(photoUrl));
        setSuccessMsg("Resident updated successfully.");
        setPhotoFile(null);
      } else {
        const created = await residentsApi.create(buildPayload());
        if (photoFile && created?.id) {
          try {
            await residentsApi.uploadPhoto(created.id, photoFile);
          } catch (uploadErr) {
            // Resident was created but the photo failed: stay in edit
            // mode for the new record so the user can retry.
            await loadResidents(false);
            setIsEditing(true);
            setFormData((prev) => ({ ...prev, id: created.id }));
            setSaveError(
              `Resident created, but the photo upload failed: ${apiErrorMessage(uploadErr, "upload failed")}`
            );
            return;
          }
        }
        setSuccessMsg("Resident added successfully.");
        setPhotoFile(null);
      }
      // Re-fetch from Neon PostgreSQL (source of truth) so the page
      // displays exactly what the database stored.
      await loadResidents(false);
      setModalOpen(false);
    } catch (err) {
      // Keep the form open with the user's input intact; show the error.
      setSaveError(apiErrorMessage(err, "Failed to save resident. No changes were applied."));
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setSaveError(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Residents"
        subtitle={`${residentList.length} total residents · ${registeredCount} registered`}
        action={
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn btn-primary btn-md"
          >
            <MaterialIcon name="add" className="text-lg" />
            Add Resident
          </button>
        }
      />

      {successMsg && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
        >
          <MaterialIcon name="check_circle" className="text-lg" />
          {successMsg}
        </div>
      )}

      {/* Search + filters */}
      <div className="admin-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <MaterialIcon name="search" className="text-lg" />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, address, contact, or email…"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All</option>
            <option value="REGISTERED">Registered</option>
            <option value="NOT_REGISTERED">Not Registered</option>
          </select>
        </div>
      </div>

      <div className="admin-card admin-table-wrap">
        {loadError && (
          <div className="m-4 p-3.5 text-sm text-red-700 bg-red-50 border-l-4 border-red-500 rounded-r">
            {loadError}
          </div>
        )}
        <table className="admin-table min-w-[880px]">
          <thead>
            <tr>
              <th>Resident ID</th>
              <th>Name</th>
              <th>Address</th>
              <th>Contact</th>
              <th>Date Registered</th>
              <th>Account Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500 py-6">
                  Loading residents...
                </td>
              </tr>
            ) : filteredResidents.length === 0 && !loadError ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500 py-6">
                  {search || statusFilter !== "ALL"
                    ? "No residents match your search."
                    : "No residents found."}
                </td>
              </tr>
            ) : (
            filteredResidents.map((r) => (
              <tr key={r.id}>
                <td className="font-semibold text-primary">{r.id}</td>
                <td className="text-gray-900 font-medium">{r.fullName}</td>
                <td className="wrap-cell text-gray-600">{r.address}</td>
                <td className="text-gray-600">{r.contactNumber}</td>
                <td className="text-gray-600">{r.dateRegistered || "—"}</td>
                <td>
                  {r.isRegistered ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                      REGISTERED
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                      NOT REGISTERED
                    </span>
                  )}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleView(r)}
                      className="btn btn-primary btn-sm"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(r)}
                      className="btn btn-secondary btn-sm"
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>

      {/* View Drawer */}
      {drawerOpen && selected && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 overlay-enter"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl drawer-enter">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Resident Information
              </h3>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                aria-label="Close details"
              >
                <MaterialIcon name="close" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="mb-5 flex flex-col items-center">
                <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-100/90 shadow-inner">
                  {selected.photoUrl ? (
                    <img
                      src={uploadImageUrl(selected.photoUrl)}
                      alt={`${selected.fullName} photo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <MaterialIcon name="person" className="text-7xl text-gray-300" />
                  )}
                </div>
              </div>
              <dl className="space-y-4">
                <InfoRow label="Full Name" value={selected.fullName} />
                <InfoRow
                  label="Account Status"
                  value={selected.isRegistered ? "REGISTERED" : "NOT REGISTERED"}
                />
                <InfoRow label="Birthdate" value={selected.birthdate} />
                <InfoRow label="Birth Place" value={selected.birthPlace || ""} />
                <InfoRow label="Age" value={String(selected.age)} />
                <InfoRow label="Gender" value={selected.gender} />
                <InfoRow label="Civil Status" value={selected.civilStatus} />
                <InfoRow label="Nationality" value={selected.nationality || "Filipino"} />
                <InfoRow label="Religion" value={selected.religion || ""} />
                <InfoRow label="Occupation" value={selected.occupation || ""} />
                <InfoRow label="Address" value={selected.address} />
                <InfoRow label="Contact Number" value={selected.contactNumber} />
                <InfoRow label="Email" value={selected.email} />
                <InfoRow label="Household Number" value={selected.householdNumber || "N/A"} />
                <InfoRow label="Emergency Contact" value={selected.emergencyContact || "N/A"} />
              </dl>
            </div>
            <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  handleOpenEdit(selected);
                }}
                className="btn btn-primary btn-md btn-block"
              >
                <MaterialIcon name="edit" className="text-lg" />
                Edit Resident
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirm("Are you sure you want to delete this resident?")) {
                    try {
                      await residentsApi.remove(selected.id);
                      setResidentList((prev) => prev.filter((item) => item.id !== selected.id));
                      setDrawerOpen(false);
                      setSuccessMsg("Resident deleted.");
                    } catch (err) {
                      setLoadError(apiErrorMessage(err, "Failed to delete resident."));
                      setDrawerOpen(false);
                    }
                  }
                }}
                className="btn btn-danger btn-md btn-block"
              >
                <MaterialIcon name="delete" className="text-lg" />
                Delete Resident
              </button>
            </div>
          </div>
        </>
      )}

      {/* MANAGE DETAILS MODAL */}
      {modalOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs overlay-enter"
            onClick={closeModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl my-8 overflow-hidden border border-gray-100">

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {isEditing ? "Edit Resident" : "Add Resident"}
                  </h2>
                  {isEditing && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      Updating resident {formData.id} · changes save to the database
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
                  aria-label="Close form"
                >
                  <MaterialIcon name="close" className="text-xl" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSave}>
                <div className="max-h-[70vh] overflow-y-auto p-6 md:p-8">
                  {saveError && (
                    <div
                      role="alert"
                      className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                    >
                      {saveError}
                    </div>
                  )}
                  <div className="flex flex-col lg:flex-row gap-8">

                    {/* Left Column - PHOTO */}
                    <div className="w-full lg:w-56 shrink-0">
                      <label className="block text-xs font-bold tracking-wider text-gray-400 uppercase mb-3">
                        PHOTO
                      </label>
                      <div className="relative flex aspect-square w-full items-center justify-center rounded-2xl bg-gray-100/90 border border-gray-200 overflow-hidden shadow-inner">
                        {formData.photoUrl ? (
                          <img
                            src={uploadImageUrl(formData.photoUrl)}
                            alt="Resident Photo"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-gray-300">
                            <MaterialIcon name="person" className="text-7xl opacity-80" />
                          </div>
                        )}
                      </div>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={handlePhotoBrowse}
                        disabled={saving}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors active:scale-[0.98] disabled:opacity-60"
                      >
                        <MaterialIcon name="image" className="text-lg" />
                        Browse
                      </button>
                    </div>

                    {/* Right Column - FORM SECTIONS */}
                    <div className="flex-1 space-y-7 min-w-0">
                      <section>
                        <div className="mb-4 pb-2 border-b border-gray-100">
                          <h3 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                            PERSONAL INFORMATION
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          <FormInputField
                            label="FIRST NAME"
                            required
                            disabled={saving}
                            value={formData.firstName}
                            onChange={(val) => setFormData({ ...formData, firstName: val })}
                            placeholder="First Name"
                          />
                          <FormInputField
                            label="MIDDLE NAME"
                            disabled={saving}
                            value={formData.middleName}
                            onChange={(val) => setFormData({ ...formData, middleName: val })}
                            placeholder="Middle Name"
                          />
                          <FormInputField
                            label="LAST NAME"
                            required
                            disabled={saving}
                            value={formData.lastName}
                            onChange={(val) => setFormData({ ...formData, lastName: val })}
                            placeholder="Last Name"
                          />
                          <FormSelectField
                            label="SUFFIX"
                            disabled={saving}
                            value={formData.suffix}
                            onChange={(val) => setFormData({ ...formData, suffix: val })}
                            options={["Select", "Jr.", "Sr.", "I", "II", "III", "IV", "V"]}
                          />
                          <FormSelectField
                            label="GENDER"
                            required
                            disabled={saving}
                            value={formData.gender}
                            onChange={(val) => setFormData({ ...formData, gender: val })}
                            options={["Male", "Female", "Other"]}
                          />
                          <FormInputField
                            label="BIRTH DATE"
                            required
                            type="date"
                            disabled={saving}
                            value={formData.birthdate}
                            onChange={handleBirthdateChange}
                          />
                          <FormInputField
                            label="BIRTH PLACE"
                            disabled={saving}
                            value={formData.birthPlace}
                            onChange={(val) => setFormData({ ...formData, birthPlace: val })}
                            placeholder="Cordova, Cebu"
                          />
                          <FormInputField
                            label="AGE"
                            disabled={saving}
                            value={formData.age}
                            onChange={(val) => setFormData({ ...formData, age: val })}
                            placeholder="Age"
                          />
                          <FormSelectField
                            label="CIVIL STATUS"
                            required
                            disabled={saving}
                            value={formData.civilStatus}
                            onChange={(val) => setFormData({ ...formData, civilStatus: val })}
                            options={["Single", "Married", "Widowed", "Separated"]}
                          />
                          <FormInputField
                            label="NATIONALITY"
                            required
                            disabled={saving}
                            value={formData.nationality}
                            onChange={(val) => setFormData({ ...formData, nationality: val })}
                            placeholder="Filipino"
                          />
                          <FormInputField
                            label="RELIGION"
                            disabled={saving}
                            value={formData.religion}
                            onChange={(val) => setFormData({ ...formData, religion: val })}
                            placeholder="Catholic"
                          />
                          <FormInputField
                            label="OCCUPATION"
                            disabled={saving}
                            value={formData.occupation}
                            onChange={(val) => setFormData({ ...formData, occupation: val })}
                            placeholder="Occupation"
                          />
                        </div>
                      </section>

                      <section>
                        <div className="mb-4 pb-2 border-b border-gray-100">
                          <h3 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                            CONTACT INFORMATION
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <FormInputField
                            label="CONTACT NUMBER"
                            required
                            disabled={saving}
                            value={formData.contactNumber}
                            onChange={(val) => setFormData({ ...formData, contactNumber: val })}
                            placeholder="09123456789"
                          />
                          <FormInputField
                            label="EMAIL"
                            type="email"
                            disabled={saving}
                            value={formData.email}
                            onChange={(val) => setFormData({ ...formData, email: val })}
                            placeholder="resident@example.com"
                          />
                          <FormInputField
                            label="ADDRESS"
                            disabled={saving}
                            value={formData.address}
                            onChange={(val) => setFormData({ ...formData, address: val })}
                            placeholder="House No., Street, Brgy. San Jose"
                          />
                        </div>
                      </section>

                      <section>
                        <div className="mb-4 pb-2 border-b border-gray-100">
                          <h3 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                            ADDITIONAL INFORMATION
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          <FormInputField
                            label="HOUSEHOLD NUMBER"
                            disabled={saving}
                            value={formData.householdNumber}
                            onChange={(val) => setFormData({ ...formData, householdNumber: val })}
                            placeholder="HH-0000"
                          />
                          <FormInputField
                            label="EMERGENCY CONTACT"
                            disabled={saving}
                            value={formData.emergencyContact}
                            onChange={(val) => setFormData({ ...formData, emergencyContact: val })}
                            placeholder="Name - 09xxxxxxxxx"
                          />
                          <FormInputField
                            label="PWD ID NO."
                            disabled={saving}
                            value={formData.pwdIdNo}
                            onChange={(val) => setFormData({ ...formData, pwdIdNo: val })}
                            placeholder="ID Number"
                          />
                          <FormSelectField
                            label="FAMILY MONTHLY INCOME"
                            disabled={saving}
                            value={formData.familyMonthlyIncome}
                            onChange={(val) => setFormData({ ...formData, familyMonthlyIncome: val })}
                            options={[
                              "Select Range",
                              "Below ₱10,000",
                              "₱10,000 - ₱20,000",
                              "₱20,000 - ₱40,000",
                              "Above ₱40,000",
                            ]}
                          />
                          <FormSelectField
                            label="INDIGENT?"
                            disabled={saving}
                            value={formData.indigent}
                            onChange={(val) => setFormData({ ...formData, indigent: val })}
                            options={["No", "Yes"]}
                          />
                          <FormSelectField
                            label="REGISTERED VOTER?"
                            disabled={saving}
                            value={formData.registeredVoter}
                            onChange={(val) => setFormData({ ...formData, registeredVoter: val })}
                            options={["Yes", "No"]}
                          />
                          <FormInputField
                            label="PRECINCT NO."
                            disabled={saving}
                            value={formData.precinctNo}
                            onChange={(val) => setFormData({ ...formData, precinctNo: val })}
                            placeholder="Precinct No."
                          />
                          <FormInputField
                            label="VOTER ID NO."
                            disabled={saving}
                            value={formData.voterIdNo}
                            onChange={(val) => setFormData({ ...formData, voterIdNo: val })}
                            placeholder="Voter ID Number"
                          />
                        </div>
                      </section>
                    </div>

                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 transition-colors disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    {saving
                      ? "Saving…"
                      : isEditing
                        ? "Save Changes"
                        : "Save Resident"}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-gray-900">{value || "—"}</dd>
    </div>
  );
}

function FormInputField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-gray-50 disabled:text-gray-400"
      />
    </div>
  );
}

function FormSelectField({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-gray-50 disabled:text-gray-400"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
