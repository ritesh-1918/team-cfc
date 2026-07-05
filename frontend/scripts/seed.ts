import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://tdhtgejsxatcsdwgsedj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkaHRnZWpzeGF0Y3Nkd2dzZWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzIzODkzMiwiZXhwIjoyMDk4ODE0OTMyfQ.AGNPhcFE7dvvIajlntmeHz7TQfxLSYEUy2RfEQn8juk"
);

const SEED = [
  { raw_text: "The pothole on Baker Street near the tube station is dangerous. Three cyclists have fallen this week.", category: "Roads & Transport", summary: "Dangerous pothole on Baker Street causing cyclist injuries", location_name: "Baker Street", ward: "Westminster", lat: 51.4975, lng: -0.1357, sentiment: "angry", urgency: "critical" },
  { raw_text: "No streetlights in Hackney park after 6pm. Elderly residents are scared to walk.", category: "Parks & Green Spaces", summary: "No lighting in Hackney park creating safety concerns for elderly", location_name: "Hackney Park", ward: "Hackney", lat: 51.5450, lng: -0.0553, sentiment: "frustrated", urgency: "high" },
  { raw_text: "GP surgery in Islington has a 3-week wait. We need a second surgery urgently.", category: "Healthcare", summary: "Severe GP capacity shortage in Islington with 3-week wait times", location_name: "Islington High Street", ward: "Islington", lat: 51.5416, lng: -0.1025, sentiment: "frustrated", urgency: "high" },
  { raw_text: "Flooding on Lambeth Road every time it rains. Drainage not maintained for years.", category: "Utilities", summary: "Chronic flooding on Lambeth Road due to unmaintained drainage", location_name: "Lambeth Road", ward: "Lambeth", lat: 51.4955, lng: -0.1162, sentiment: "frustrated", urgency: "high" },
  { raw_text: "School in Tower Hamlets has 40 children per class. Teachers are overwhelmed.", category: "Education", summary: "Overcrowded classrooms in Tower Hamlets schools", location_name: "Tower Hamlets Primary", ward: "Tower Hamlets", lat: 51.5099, lng: -0.0059, sentiment: "frustrated", urgency: "medium" },
  { raw_text: "Second pothole issue on High Street Westminster near bus stop 42.", category: "Roads & Transport", summary: "Road surface damage near bus stop 42 in Westminster", location_name: "High Street Westminster", ward: "Westminster", lat: 51.4980, lng: -0.1340, sentiment: "neutral", urgency: "medium" },
  { raw_text: "Park benches in Camden are broken and dangerous for children.", category: "Parks & Green Spaces", summary: "Broken park benches creating hazards for children in Camden", location_name: "Camden Park", ward: "Camden", lat: 51.5390, lng: -0.1426, sentiment: "neutral", urgency: "medium" },
  { raw_text: "Road in Hackney has large cracks and surface damage. Dangerous for cyclists and pedestrians.", category: "Roads & Transport", summary: "Road surface cracking and damage in Hackney posing hazard", location_name: "Hackney Road", ward: "Hackney", lat: 51.5455, lng: -0.0560, sentiment: "frustrated", urgency: "high" },
  { raw_text: "No housing support available in Newham. Families sleeping in cars.", category: "Housing", summary: "Critical housing shortage in Newham with families homeless", location_name: "Newham Council", ward: "Newham", lat: 51.5077, lng: 0.0469, sentiment: "angry", urgency: "critical" },
  { raw_text: "Anti-social behaviour in Southwark getting worse. Police response time over an hour.", category: "Safety & Crime", summary: "Rising anti-social behaviour in Southwark with poor police response", location_name: "Southwark High Street", ward: "Southwark", lat: 51.5035, lng: -0.0804, sentiment: "angry", urgency: "critical" },
  { raw_text: "Westminster road near parliament still not repaired after 3 months of reports.", category: "Roads & Transport", summary: "Long-standing road damage in Westminster not repaired after multiple reports", location_name: "Parliament Road, Westminster", ward: "Westminster", lat: 51.4975, lng: -0.1357, sentiment: "angry", urgency: "high" },
  { raw_text: "Hackney park lighting is a real issue. Many women avoid the park at night.", category: "Parks & Green Spaces", summary: "Safety concern: Hackney park darkness deters women at night", location_name: "Hackney Park East", ward: "Hackney", lat: 51.5445, lng: -0.0548, sentiment: "frustrated", urgency: "high" },
];

async function seed() {
  console.log("Seeding demo submissions...");
  const { data, error } = await supabase.from("submissions").insert(SEED).select();
  if (error) { console.error("Seed failed:", error); return; }
  console.log(`Seeded ${data?.length} submissions`);
}

seed();
