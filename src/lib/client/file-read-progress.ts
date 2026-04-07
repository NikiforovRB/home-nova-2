/** Чтение файла в data URL с событием progress (если браузер отдаёт lengthComputable). */
export function readFileAsDataURLWithProgress(
  file: File,
  onProgress: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        onProgress(Math.min(100, Math.round((100 * e.loaded) / e.total)));
      }
    };
    reader.onload = () => {
      onProgress(100);
      const r = reader.result;
      if (typeof r === "string") resolve(r);
      else reject(new Error("read failed"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("read error"));
    reader.readAsDataURL(file);
  });
}

/** POST FormData с отслеживанием upload progress (тело запроса). */
export function postFormDataWithProgress(
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<{ ok: boolean; status: number; json: unknown }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        onProgress(Math.min(100, Math.round((100 * e.loaded) / e.total)));
      }
    };
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText || "{}");
        resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, json });
      } catch {
        resolve({ ok: false, status: xhr.status, json: null });
      }
    };
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(formData);
  });
}
