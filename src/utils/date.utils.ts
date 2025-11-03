export function calculateAge(manufacturedDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - manufacturedDate.getFullYear();
  
  const monthDifference = today.getMonth() - manufacturedDate.getMonth();
  
  // to get year exactly 
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < manufacturedDate.getDate())
  ) {
    age--;
  }
  
  return age;
}