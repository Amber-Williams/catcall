import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setPublicDir("./public");
Config.setBrowserExecutable(
  "/root/.cache/rod/browser/chromium-1321438/chrome"
);
