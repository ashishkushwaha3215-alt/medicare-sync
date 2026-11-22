import { jsPDF } from 'jspdf';

export const generatePrescriptionPdf = (appt) => {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(2, 132, 199);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MediCare Sync — Digital Prescription', 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Smart Clinic & Patient Portal | Verified Electronic Medical Record', 14, 25);

  // Doctor & Appointment Metadata
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Doctor: ${appt.doctor?.user?.name || 'Specialist'}`, 14, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Specialization: ${appt.doctor?.specialization || 'General'}`, 14, 50);
  doc.text(`Date & Slot: ${appt.appointmentDate} (${appt.timeSlot})`, 130, 44);
  doc.text(`Appointment ID: ${appt._id?.slice(-8).toUpperCase()}`, 130, 50);

  doc.setDrawColor(203, 213, 225);
  doc.line(14, 55, 196, 55);

  // Patient Details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Details:', 14, 63);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Name: ${appt.patient?.name || 'Patient'}`, 14, 70);
  doc.text(`Phone: ${appt.patient?.phone || 'N/A'}`, 95, 70);
  doc.text(
    `Age/Gender: ${appt.patient?.age || '—'} yrs / ${appt.patient?.gender || '—'} | Blood: ${
      appt.patient?.bloodGroup || '—'
    }`,
    14,
    76
  );

  doc.line(14, 82, 196, 82);

  // Diagnosis
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(3, 105, 161);
  doc.text('Diagnosis (Dx):', 14, 92);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(appt.prescription?.diagnosis || 'N/A', 14, 99);

  // Medicines List
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(3, 105, 161);
  doc.text('Prescribed Medicines (Rx):', 14, 113);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);

  const meds = appt.prescription?.medicines || [];
  let y = 121;
  meds.forEach((med, index) => {
    doc.text(`${index + 1}. ${med}`, 18, y);
    y += 7;
  });

  // Doctor Advice / Notes
  y += 6;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(3, 105, 161);
  doc.text('Clinical Notes & Advice:', 14, y);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const splitNotes = doc.splitTextToSize(
    appt.prescription?.notes || 'Follow dosage instructions and stay hydrated.',
    180
  );
  doc.text(splitNotes, 14, y + 7);

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Digitally signed via MediCare Sync RBAC Portal. Valid without physical stamp.',
    14,
    282
  );

  doc.save(`Prescription_${appt.patient?.name || 'Patient'}_${appt.appointmentDate}.pdf`);
};