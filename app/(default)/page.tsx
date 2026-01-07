import type { Metadata } from "next";
import LocationSplash from "@/components/LocationSplash";

export const metadata: Metadata = {
  title: "Ready to Get a Little Higher? | Just a Little Higher",
  description:
    "Choose the Just a Little Higher dispensary closest to you across five New York locations. See who is open now, use your location, and start shopping fast.",
};

export default function Home() {
  return <LocationSplash />;
}