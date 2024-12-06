// the curated library and placeholder entries (keep updating...)

export const medications = [
  {
    name: 'Adderall XR',
    dosageForms: [20, 25, 30, 35, 40], // in mg
    defaultDosage: 20,
    maxDosage: 40,
    frequencyOptions: ['daily', 'twice daily', 'weekly', 'as needed'],
    icon: require('../assets/adderall-icon.png'),
  },
  {
    name: 'Vyvanse',
    dosageForms: [30, 40, 50, 60, 70], // in mg
    defaultDosage: 30,
    maxDosage: 70,
    frequencyOptions: ['daily', 'twice daily', 'weekly', 'as needed'],
    icon: require('../assets/vyvanse-icon.png'),
  },
  {
    name: 'Placeholder Med 1',
    dosageForms: [10, 20, 30],
    defaultDosage: 10,
    maxDosage: 30,
    frequencyOptions: ['daily', 'twice daily', 'weekly', 'as needed'],
    icon: require('../assets/default-pill-icon.png'),
  },
  {
    name: 'Placeholder Med 2',
    dosageForms: [10, 20, 30],
    defaultDosage: 10,
    maxDosage: 30,
    frequencyOptions: ['daily', 'twice daily', 'weekly', 'as needed'],
    icon: require('../assets/default-pill-icon.png'),
  },
];
