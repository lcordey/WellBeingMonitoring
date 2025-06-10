// These enums are shared with the backend. If you want to keep them in sync, consider generating them from the backend C# code or maintaining them in one place only.
export enum ObservationType {
  None = 'None',
  Alcohol = 'Alcohol',
  Sleep = 'Sleep',
  Food = 'Food',
  SunExposure = 'SunExposure',
  Other = 'Other',
}

export enum SymptomType {
  None = 'None',
  Headache = 'Headache',
  Tiredness = 'Tiredness',
  Nausea = 'Nausea',
  Allergy = 'Allergy',
  Other = 'Other',
}