"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { clientApi } from "@/services/api";
import type { AuthUser } from "@/lib/types";
import { MaterialIcon } from "@/components/admin/MaterialIcon";
import { ClientPageShell } from "../components/ClientPageShell";
import { mediaUrl } from "@/lib/media";

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      try {
        const profile = await clientApi.getProfile();
        setUser(profile);
        setFullname(profile.fullname || "");
        setEmail(profile.email || "");
        setPhoneNumber(profile.phoneNumber || "");
        setLocation(localStorage.getItem(`client_location_${profile.id}`) || "");
        localStorage.setItem("user", JSON.stringify(profile));
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const initials = useMemo(() => {
    const name = fullname || user?.username || "R";
    return (
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "R"
    );
  }, [fullname, user?.username]);

  const avatarSrc = mediaUrl(user?.profilePicture);

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);
    setUploadingPhoto(true);
    try {
      const updated = await clientApi.uploadProfilePicture(file);
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      setSuccess("Profile picture updated.");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Unable to upload profile picture.");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const updated = await clientApi.updateProfile({
        fullname: fullname.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || null,
      });
      setUser(updated);
      setFullname(updated.fullname || "");
      setEmail(updated.email || "");
      setPhoneNumber(updated.phoneNumber || "");
      localStorage.setItem("user", JSON.stringify(updated));
      localStorage.setItem(`client_location_${updated.id}`, location.trim());
      setEditing({});
      setSuccess("Profile changes saved successfully.");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClientPageShell>
      <div>
        {loading ? (
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-slate-600">Loading profile...</p>
          </div>
        ) : error && !user ? (
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-red-600">{error}</p>
          </div>
        ) : user ? (
          <div className="rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-8">
            <div className="flex flex-col items-start gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#2563EB] text-3xl font-bold text-white">
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarSrc} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm disabled:opacity-60"
                  aria-label="Edit photo"
                >
                  <MaterialIcon name="edit" className="text-[16px]" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {fullname || user.username}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{email}</p>
                {uploadingPhoto ? (
                  <p className="mt-1 text-xs text-slate-400">Uploading photo...</p>
                ) : null}
              </div>
            </div>

            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
            {success ? <p className="mt-4 text-sm text-emerald-600">{success}</p> : null}

            <div className="mt-2">
              <ProfileRow
                label="Name"
                value={fullname}
                editing={!!editing.fullname}
                onEdit={() => setEditing((prev) => ({ ...prev, fullname: true }))}
                onChange={setFullname}
              />
              <ProfileRow
                label="Email Account"
                value={email}
                editing={!!editing.email}
                onEdit={() => setEditing((prev) => ({ ...prev, email: true }))}
                onChange={setEmail}
              />
              <ProfileRow
                label="Mobile Number"
                value={phoneNumber}
                editing={!!editing.phoneNumber}
                onEdit={() => setEditing((prev) => ({ ...prev, phoneNumber: true }))}
                onChange={setPhoneNumber}
              />
              <ProfileRow
                label="Location"
                value={location}
                editing={!!editing.location}
                onEdit={() => setEditing((prev) => ({ ...prev, location: true }))}
                onChange={setLocation}
              />
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="font-semibold text-slate-900">Profile details unavailable.</p>
          </div>
        )}
      </div>
    </ClientPageShell>
  );
}

function ProfileRow({
  label,
  value,
  editing,
  onEdit,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onEdit: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-200 py-4">
      <p className="w-36 shrink-0 text-sm font-medium text-slate-600 sm:w-44">{label}</p>
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
          />
        ) : (
          <p className="truncate text-right text-sm font-semibold text-slate-900 sm:text-left">
            {value || "Not set"}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#2563EB] text-[#2563EB] transition hover:bg-blue-50"
        aria-label={`Edit ${label}`}
      >
        <MaterialIcon name="edit" className="text-[16px]" />
      </button>
    </div>
  );
}
