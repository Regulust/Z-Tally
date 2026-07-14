import { resetPageBrightTime } from "@zos/display";

App({
  onDestroy() {
    try {
      resetPageBrightTime();
    } catch (_error) {}
  },
});
