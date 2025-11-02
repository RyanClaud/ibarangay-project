'use client';

import { EditProfileForm } from "./edit-profile-form";
import { ChangePasswordForm } from "./change-password-form";

export function ResidentSettings() {
  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      <div className="space-y-6">
        <EditProfileForm />
      </div>
      <div className="space-y-6">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
