export interface LocationInfo {
  lat: number;
  lon: number;
  district: string;
  upazila: string;
  address: string;
  city: string;
}

const allDistricts = [
  "ঢাকা","চট্টগ্রাম","রাজশাহী","খুলনা","বরিশাল","সিলেট","রংপুর",
  "ময়মনসিংহ","গাজীপুর","নারায়ণগঞ্জ","কুমিল্লা","বগুড়া",
  "দিনাজপুর","জয়পুরহাট","পাবনা","সিরাজগঞ্জ","নাটোর","নওগাঁ",
  "চাঁপাইনবাবগঞ্জ","টাঙ্গাইল","কিশোরগঞ্জ","মানিকগঞ্জ","মুন্সীগঞ্জ",
  "নরসিংদী","ফরিদপুর","গোপালগঞ্জ","মাদারীপুর","শরীয়তপুর","লক্ষ্মীপুর",
  "চাঁদপুর","নোয়াখালী","ফেনী","ব্রাহ্মণবাড়িয়া","হবিগঞ্জ",
  "সুনামগঞ্জ","মৌলভীবাজার","কক্সবাজার","বান্দরবান","রাঙ্গামাটি",
  "খাগড়াছড়ি","পটুয়াখালী","ভোলা","পিরোজপুর","ঝালকাঠি","বরগুনা",
  "সাতক্ষীরা","যশোর","মাগুরা","নড়াইল","বাগেরহাট","চুয়াডাঙ্গা",
  "মেহেরপুর","ঝিনাইদহ","কুষ্টিয়া","লালমনিরহাট","নীলফামারী",
  "ঠাকুরগাঁও","পঞ্চগড়","কুড়িগ্রাম","গাইবান্ধা","শেরপুর",
  "নেত্রকোনা","জামালপুর",
];

export function getAllDistricts(): string[] {
  return allDistricts;
}

export async function detectLocation(): Promise<LocationInfo | null> {
  try {
    const pos = await new Promise<GeolocationPosition>((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      })
    );

    const { latitude: lat, longitude: lon } = pos.coords;
    const geoUrl = "https://nominatim.openstreetmap.org/reverse";
    const geo = await fetch(
      `/api/proxy?target=${encodeURIComponent(geoUrl)}&lat=${lat}&lon=${lon}&format=json&accept-language=bn`
    ).then((r) => r.json());

    const addr = geo.address || {};
    const district =
      addr.state_district || addr.state || addr.county || addr.city || "ঢাকা";
    const upazila =
      addr.city_district || addr.county || addr.town || addr.village || "";
    const city = addr.city || addr.town || addr.county || district;
    const address = geo.display_name || "";

    // Save to localStorage
    localStorage.setItem("krishi_district", district);
    localStorage.setItem("krishi_upazila", upazila);
    localStorage.setItem("krishi_lat", String(lat));
    localStorage.setItem("krishi_lon", String(lon));

    return { lat, lon, district, upazila, address, city };
  } catch {
    // Fallback: use existing saved values
    const district = localStorage.getItem("krishi_district") || "ঢাকা";
    const upazila = localStorage.getItem("krishi_upazila") || "";
    return {
      lat: 23.8103,
      lon: 90.4125,
      district,
      upazila,
      address: "",
      city: district,
    };
  }
}

export function getStoredLocation(): { district: string; upazila: string; lat: number; lon: number } {
  return {
    district: localStorage.getItem("krishi_district") || "ঢাকা",
    upazila: localStorage.getItem("krishi_upazila") || "",
    lat: Number(localStorage.getItem("krishi_lat")) || 23.8103,
    lon: Number(localStorage.getItem("krishi_lon")) || 90.4125,
  };
}
