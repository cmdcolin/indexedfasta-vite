import { useState, useMemo, useEffect } from "react";
import { BgzipIndexedFasta, IndexedFasta } from "@gmod/indexedfasta";
import { RemoteFile } from "generic-filehandle";

function App() {
  const [url, setUrl] = useState(
    "https://jbrowse.org/genomes/hg19/fasta/hg19.fa.gz",
  );
  const [strings, setStrings] = useState("1:1-100");
  const [data, setData] = useState<(string | undefined)[]>();
  const [error, setError] = useState<unknown>();
  const t = useMemo(
    () =>
      url.endsWith(".gz")
        ? new BgzipIndexedFasta({
            fasta: new RemoteFile(url),
            fai: new RemoteFile(url + ".fai"),
            gzi: new RemoteFile(url + ".gzi"),
          })
        : new IndexedFasta({
            fasta: new RemoteFile(url),
            fai: new RemoteFile(url + ".fai"),
          }),
    [url],
  );
  const locStrings = useMemo(() => strings.split("\n"), [strings]);
  useEffect(() => {
    (async () => {
      try {
        setError(undefined);
        setData(
          await Promise.all(
            locStrings
              .map((s) => {
                const [name, rest] = s.split(":");
                const [start, end] = rest.split("-");
                return { name, start: +start, end: +end };
              })
              .map(({ name, start, end }) =>
                t.getResiduesByName(name, start, end),
              ),
          ),
        );
      } catch (e) {
        setError(e);
      }
    })();
  }, [t, locStrings]);
  return (
    <>
      <div style={{ margin: 20 }}>
        <label htmlFor="url">URL: </label>
        <input
          id="url"
          type="text"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
      </div>
      <div style={{ margin: 20 }}>
        <label htmlFor="locstrings">Loc strings:</label>
        <textarea
          id="locstrings"
          value={strings}
          onChange={(event) => setStrings(event.target.value)}
        ></textarea>
      </div>
      {error ? <div style={{ color: "red" }}>{`${error}`}</div> : null}
      <pre
        style={{ margin: 20, whiteSpace: "pre-wrap", wordWrap: "break-word" }}
      >
        {data?.map((s, i) => `>${locStrings[i]}\n${s}\n`)}
      </pre>
    </>
  );
}

export default App;
