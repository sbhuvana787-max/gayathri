import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import { useBusiness } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateBusiness } from "@/hooks/useBusinessQuery";
import {
  SectionCard,
  FormField,
  TextInput,
  TextArea,
  Select,
  SaveBar,
} from "@/components/settings/shared";
import { businessTypeOptions, indianStates } from "@/lib/settings-data";

export function BusinessProfileTab() {
  const { business } = useBusiness();
  const { user } = useAuth();
  const updateBusiness = useUpdateBusiness(user?.id ?? null);

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!business) return;
    setName(business.business_name ?? "");
    setType(business.business_type ?? "");
    setGstin(business.gst_number ?? "");
    setPan(business.pan_number ?? "");
    setAddress(business.address ?? "");
    setCity(business.city ?? "");
    setState(business.state ?? "");
    setCountry(business.country ?? "");
    setPostalCode(business.postal_code ?? "");
    setPhone(business.phone ?? "");
    setEmail(business.email ?? "");
    setWebsite(business.website ?? "");
    setDescription(business.description ?? "");
  }, [business]);

  async function handleSave() {
    try {
      await updateBusiness.mutateAsync({
        business_name: name.trim() || null,
        business_type: type || null,
        gst_number: gstin.trim() || null,
        pan_number: pan.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state || null,
        country: country.trim() || "India",
        postal_code: postalCode.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        description: description.trim() || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save business profile.");
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Business Profile"
        subtitle="Core details used across invoices, quotations, and official documents"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Business Name">
            <TextInput value={name} onChange={setName} />
          </FormField>
          <FormField label="Business Type">
            <Select
              value={type}
              onChange={setType}
              options={businessTypeOptions}
              className="w-full"
            />
          </FormField>
          <FormField label="GSTIN" hint="15-character GST identification number">
            <TextInput value={gstin} onChange={setGstin} />
          </FormField>
          <FormField label="PAN" hint="10-character Permanent Account Number">
            <TextInput value={pan} onChange={setPan} />
          </FormField>
          <FormField label="Address" className="sm:col-span-2">
            <TextInput value={address} onChange={setAddress} />
          </FormField>
          <FormField label="City">
            <TextInput value={city} onChange={setCity} />
          </FormField>
          <FormField label="State">
            <Select
              value={state}
              onChange={setState}
              options={indianStates.map((s) => ({ value: s, label: s }))}
              className="w-full"
            />
          </FormField>
          <FormField label="Country">
            <TextInput value={country} onChange={setCountry} />
          </FormField>
          <FormField label="Postal Code">
            <TextInput value={postalCode} onChange={setPostalCode} />
          </FormField>
          <FormField label="Phone">
            <TextInput value={phone} onChange={setPhone} type="tel" />
          </FormField>
          <FormField label="Email">
            <TextInput value={email} onChange={setEmail} type="email" />
          </FormField>
          <FormField label="Website" className="sm:col-span-2">
            <TextInput value={website} onChange={setWebsite} />
          </FormField>
          <FormField label="Business Description" className="sm:col-span-2">
            <TextArea value={description} onChange={setDescription} rows={4} />
          </FormField>
        </div>
      </SectionCard>

      <SaveBar
        saved={saved}
        onSave={handleSave}
        label={updateBusiness.isPending ? "Saving…" : "Save Changes"}
      />
    </div>
  );
}
