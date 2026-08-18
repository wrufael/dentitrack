import React, { useState } from "react";
import toast from "react-hot-toast";
import ProfileSettings from "../settings/ProfileSettings";

export default function AdminSettings() {
  const [platformName, setPlatformName] = useState("DentiTrack");
  const [supportEmail, setSupportEmail] = useState("support@dentitrack.et");

  const savePlatformSettings = (e) => {
    e.preventDefault();
    toast.success("Platform settings saved");
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-sm text-gray-400">Platform-wide configuration.</p>
      </div>

      <form onSubmit={savePlatformSettings} className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
        <h3 className="font-heading font-bold text-gray-900 mb-2">Platform</h3>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Platform Name</label>
          <input value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Support Email</label>
          <input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
        </div>
        <button type="submit" className="w-full bg-[#0EA5A5] text-white rounded-lg py-2.5 text-sm font-medium">
          Save Platform Settings
        </button>
      </form>

      <ProfileSettings />
    </div>
  );
}