import https from "https";

export interface TornStats {
  energy: number;
  nerve: number;
}

export function fetchTornStats(apiKey: string): Promise<TornStats> {
  const url = `https://api.torn.com/user/?selections=basic,values&key=${apiKey}`;
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`Torn API HTTP ${res.statusCode}`));
        }
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const d = JSON.parse(body);
            resolve({
              energy: d.energy.current,
              nerve:  d.nerve.current
            });
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", reject);
  });
}
