import { PatientLocaleProvider } from "@/components/patient-locale-provider";
import { PatientShell } from "@/components/patient-shell";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PatientLocaleProvider>
      <PatientShell>{children}</PatientShell>
    </PatientLocaleProvider>
  );
}
