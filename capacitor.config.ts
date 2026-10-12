import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.rahulrajput.coinquest",
  appName: "CashGPT",
  webDir: "dist",
  server: {
    url: "https://cashgpt.in",
    cleartext: false,
  },
};

export default config;
