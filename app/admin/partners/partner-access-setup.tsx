"use client";

import { useState } from "react";

function makeTemporaryPassword() {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = new Uint32Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
}

export function PartnerAccessSetup() {
  const [password, setPassword] = useState("");

  return (
    <div className="partnerAccessSetup">
      <label>
        Add portal login email
        <input
          name="portalEmail"
          type="email"
          placeholder="name@organisation.eu"
          autoComplete="off"
        />
      </label>

      <label>
        Temporary password
        <div className="partnerTempPasswordRow">
          <input
            name="temporaryPassword"
            type="text"
            minLength={12}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 12 characters for a new account"
            autoComplete="off"
          />
          <button
            className="button"
            type="button"
            onClick={() => setPassword(makeTemporaryPassword())}
          >
            Generate
          </button>
        </div>
        <small className="fieldHelp">
          For a new partner email, set or generate a temporary password. The partner
          confirms the email and must replace this password at first access. If the
          email already has a CraftID account, its existing password is never changed.
        </small>
      </label>
    </div>
  );
}
