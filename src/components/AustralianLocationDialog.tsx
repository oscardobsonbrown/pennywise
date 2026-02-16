import { Input } from "@base-ui/react/input";
import { useEffect, useState } from "react";

import {
  AUSTRALIAN_STATES,
  type AustralianState,
  getPostcodeData,
  isValidAustralianPostcode,
} from "../data/postcodes";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

interface Props {
  isOpen: boolean;
  onSubmit: (location: { postcode: string; suburb: string; state: AustralianState }) => void;
  onClose: () => void;
  skipOpenAnimation?: boolean;
}

export function AustralianLocationDialog({ isOpen, onSubmit, onClose, skipOpenAnimation }: Props) {
  const [postcode, setPostcode] = useState("");
  const [suburb, setSuburb] = useState("");
  const [state, setState] = useState<AustralianState | "">("");
  const [availableSuburbs, setAvailableSuburbs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill suburb and state when postcode is entered
  useEffect(() => {
    if (postcode.length === 4 && isValidAustralianPostcode(postcode)) {
      const data = getPostcodeData(postcode);
      if (data) {
        setAvailableSuburbs(data.suburbs);
        setState(data.state as AustralianState);
        // Auto-select first suburb if only one available
        if (data.suburbs.length === 1 && data.suburbs[0]) {
          setSuburb(data.suburbs[0]);
        } else if (!data.suburbs.includes(suburb)) {
          setSuburb("");
        }
      } else {
        setAvailableSuburbs([]);
        setState("");
        setSuburb("");
      }
    } else {
      setAvailableSuburbs([]);
    }
  }, [postcode, suburb]);

  function handleSubmit() {
    setError(null);

    if (!postcode || !suburb || !state) {
      setError("Please fill in all fields");
      return;
    }

    if (!isValidAustralianPostcode(postcode)) {
      setError("Please enter a valid 4-digit Australian postcode");
      return;
    }

    onSubmit({ postcode, suburb, state });
  }

  const isSuburbDisabled = availableSuburbs.length === 0;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title="Australian Taxpayer Location"
      description="Enter your location details for accurate Australian tax calculations"
      size="md"
      showClose={false}
      skipOpenAnimation={skipOpenAnimation}
    >
      <div className="space-y-4">
        {/* Postcode Input */}
        <div>
          <label htmlFor="postcode" className="mb-2 block text-sm font-medium">
            Postcode
          </label>
          <Input
            id="postcode"
            type="text"
            value={postcode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 4);
              setPostcode(value);
            }}
            placeholder="e.g. 2000"
            maxLength={4}
            autoComplete="postal-code"
            className="w-full rounded-lg border border-(--color-border) bg-(--color-bg-muted) px-3 py-2.5 text-sm placeholder:text-(--color-text-muted) focus:border-(--color-text-muted) focus:outline-none"
          />
        </div>

        {/* Suburb Selection */}
        <div>
          <label htmlFor="suburb" className="mb-2 block text-sm font-medium">
            Suburb
          </label>
          {availableSuburbs.length > 1 ? (
            <select
              id="suburb"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              className="w-full rounded-lg border border-(--color-border) bg-(--color-bg-muted) px-3 py-2.5 text-sm focus:border-(--color-text-muted) focus:outline-none"
            >
              <option value="">Select a suburb...</option>
              {availableSuburbs.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id="suburb"
              type="text"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              placeholder={isSuburbDisabled ? "Enter postcode first..." : "Suburb"}
              disabled={isSuburbDisabled}
              autoComplete="address-level2"
              className="w-full rounded-lg border border-(--color-border) bg-(--color-bg-muted) px-3 py-2.5 text-sm placeholder:text-(--color-text-muted) focus:border-(--color-text-muted) focus:outline-none disabled:opacity-50"
            />
          )}
        </div>

        {/* State Selection */}
        <div>
          <label htmlFor="state" className="mb-2 block text-sm font-medium">
            State / Territory
          </label>
          <select
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value as AustralianState)}
            className="w-full rounded-lg border border-(--color-border) bg-(--color-bg-muted) px-3 py-2.5 text-sm focus:border-(--color-text-muted) focus:outline-none"
          >
            <option value="">Select state...</option>
            {AUSTRALIAN_STATES.map((s: AustralianState) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Error Message */}
        {error && <div className="text-sm text-(--color-negative)">{error}</div>}

        {/* Submit Button */}
        <Button onClick={handleSubmit} className="w-full">
          Continue
        </Button>
      </div>
    </Dialog>
  );
}
