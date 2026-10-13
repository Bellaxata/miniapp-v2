(async function () {
    const user = await guardAuth();
    if (!user) return;

    const content = renderShell(user, "/tools.html");
    setPageTitle("Tools");
    content.innerHTML = `
        <div class="page-intro"><div><span class="page-kicker">Everyday utilities</span><h2>Tools</h2><p>Small, reliable helpers for common panel tasks.</p></div></div>
        <div class="tools-grid">
            <section class="card tool-card">
                <div class="section-heading"><div><h3>JSON Formatter</h3><p>Validate and format JSON safely.</p></div><span class="tool-status" id="json-status">Ready</span></div>
                <textarea id="json-input" class="tool-textarea" placeholder='{"name":"value"}' spellcheck="false"></textarea>
                <div class="tool-actions"><button class="btn" id="json-format" type="button">Format JSON</button><button class="btn secondary" id="json-clear" type="button">Clear</button></div>
            </section>
            <section class="card tool-card">
                <div class="section-heading"><div><h3>Text Analyzer</h3><p>Count characters, words, and lines.</p></div><span class="tool-status" id="text-count">0 chars</span></div>
                <textarea id="text-input" class="tool-textarea" placeholder="Paste text here..."></textarea>
                <div class="tool-metrics"><span><strong id="text-words">0</strong> words</span><span><strong id="text-lines">0</strong> lines</span><span><strong id="text-bytes">0</strong> bytes</span></div>
            </section>
            <section class="card tool-card">
                <div class="section-heading"><div><h3>URL Encoder</h3><p>Encode or decode query-safe text.</p></div><span class="tool-status" id="url-status">Ready</span></div>
                <textarea id="url-input" class="tool-textarea" placeholder="https://example.com/?q=hello world"></textarea>
                <div class="tool-actions"><button class="btn" id="url-encode" type="button">Encode</button><button class="btn secondary" id="url-decode" type="button">Decode</button></div>
            </section>
            <section class="card tool-card">
                <div class="section-heading"><div><h3>Timestamp</h3><p>Convert Unix timestamps to local time.</p></div><span class="tool-status" id="time-status">Live</span></div>
                <div class="timestamp-value" id="timestamp-now">-</div>
                <div class="field"><label for="timestamp-input">Unix timestamp</label><input id="timestamp-input" type="number" placeholder="1700000000"></div>
                <div class="tool-actions"><button class="btn" id="timestamp-convert" type="button">Convert</button><button class="btn secondary" id="timestamp-now-btn" type="button">Use now</button></div>
                <div class="tool-result" id="timestamp-result">Enter a timestamp to convert.</div>
            </section>
            <section class="card tool-card tool-api-card">
                <div class="section-heading"><div><h3>Panel API Health</h3><p>Check the services connected to this workspace.</p></div><span class="tool-status" id="api-status">Not checked</span></div>
                <div class="api-check-list" id="api-check-list"><span class="sub">Press Check APIs to run a live check.</span></div>
                <div class="tool-actions"><button class="btn" id="api-check" type="button">Check APIs</button></div>
            </section>

            <!-- ============ DEOBFUSCATOR ============ -->
            <section class="card tool-card">
                <div class="section-heading">
                    <div><h3>JS Deobfuscator</h3><p>Unpack &amp; deobfuscate .js atau .zip (mode generic).</p></div>
                    <span class="tool-status" id="deob-status">Ready</span>
                </div>
                <div class="field">
                    <label for="deob-file">File (.js / .zip)</label>
                    <input id="deob-file" type="file" accept=".js,.zip" />
                </div>
                <div class="tool-actions">
                    <button class="btn" id="deob-run" type="button">Deobfuscate</button>
                    <button class="btn secondary" id="deob-reset" type="button">Reset</button>
                </div>
                <progress id="deob-progress" value="0" max="100" style="width:100%;margin-top:.5rem;"></progress>
                <div class="tool-result" id="deob-result">Pilih file lalu tekan Deobfuscate.</div>
            </section>
        </div>
    `;

    // ================= JSON FORMATTER =================
    const jsonInput = document.getElementById("json-input");
    document.getElementById("json-format").addEventListener("click", () => {
        const status = document.getElementById("json-status");
        try {
            jsonInput.value = JSON.stringify(JSON.parse(jsonInput.value), null, 2);
            status.textContent = "Valid JSON";
            status.className = "tool-status success";
        } catch (error) {
            status.textContent = error.message.replace("JSON.parse: ", "");
            status.className = "tool-status error";
        }
    });
    document.getElementById("json-clear").addEventListener("click", () => {
        jsonInput.value = "";
        document.getElementById("json-status").textContent = "Ready";
    });

    // ================= TEXT ANALYZER =================
    const textInput = document.getElementById("text-input");
    function updateTextStats() {
        const text = textInput.value;
        document.getElementById("text-count").textContent = `${text.length} chars`;
        document.getElementById("text-words").textContent = text.trim() ? text.trim().split(/\s+/).length : 0;
        document.getElementById("text-lines").textContent = text ? text.split(/\r?\n/).length : 0;
        document.getElementById("text-bytes").textContent = new TextEncoder().encode(text).length;
    }
    textInput.addEventListener("input", updateTextStats);

    // ================= URL ENCODER =================
    const urlInput = document.getElementById("url-input");
    document.getElementById("url-encode").addEventListener("click", () => {
        urlInput.value = encodeURIComponent(urlInput.value);
        document.getElementById("url-status").textContent = "Encoded";
    });
    document.getElementById("url-decode").addEventListener("click", () => {
        try {
            urlInput.value = decodeURIComponent(urlInput.value);
            document.getElementById("url-status").textContent = "Decoded";
        } catch { document.getElementById("url-status").textContent = "Invalid encoding"; }
    });

    // ================= TIMESTAMP =================
    const timestampNow = document.getElementById("timestamp-now");
    timestampNow.textContent = Math.floor(Date.now() / 1000);
    document.getElementById("timestamp-now-btn").addEventListener("click", () => {
        document.getElementById("timestamp-input").value = Math.floor(Date.now() / 1000);
        document.getElementById("timestamp-convert").click();
    });
    document.getElementById("timestamp-convert").addEventListener("click", () => {
        const value = Number(document.getElementById("timestamp-input").value);
        const result = document.getElementById("timestamp-result");
        if (!Number.isFinite(value)) { result.textContent = "Enter a valid timestamp."; return; }
        const date = new Date(value < 100000000000 ? value * 1000 : value);
        result.textContent = Number.isNaN(date.getTime()) ? "Invalid timestamp." : date.toLocaleString();
    });

    // ================= API HEALTH =================
    document.getElementById("api-check").addEventListener("click", async () => {
        const status = document.getElementById("api-status");
        const list = document.getElementById("api-check-list");
        status.textContent = "Checking...";
        list.innerHTML = "<span class=\"sub\">Contacting panel services...</span>";
        const checks = await Promise.allSettled([
            api("/system"),
            api("/branding"),
            api("/auth/me"),
        ]);
        const names = ["System API", "Branding API", "Auth API"];
        list.innerHTML = checks.map((result, index) => `<div class="api-check-row"><span>${names[index]}</span><strong class="${result.status === "fulfilled" ? "success" : "error"}">${result.status === "fulfilled" ? "Online" : "Unavailable"}</strong></div>`).join("");
        const passed = checks.filter((result) => result.status === "fulfilled").length;
        status.textContent = `${passed}/${checks.length} online`;
        status.className = `tool-status ${passed === checks.length ? "success" : "error"}`;
    });

    // ================= JS DEOBFUSCATOR =================
    const deobFile     = document.getElementById("deob-file");
    const deobRun      = document.getElementById("deob-run");
    const deobReset    = document.getElementById("deob-reset");
    const deobStatus   = document.getElementById("deob-status");
    const deobResult   = document.getElementById("deob-result");
    const deobProgress = document.getElementById("deob-progress");

    function deobSetStatus(text, cls = "") {
        deobStatus.textContent = text;
        deobStatus.className = "tool-status " + cls;
    }

    deobReset.addEventListener("click", () => {
        deobFile.value = "";
        deobProgress.value = 0;
        deobResult.textContent = "Pilih file lalu tekan Deobfuscate.";
        deobSetStatus("Ready");
    });

    deobRun.addEventListener("click", () => {
        const f = deobFile.files[0];
        if (!f) {
            deobResult.textContent = "Pilih file .js atau .zip dulu.";
            deobSetStatus("No file", "error");
            return;
        }
        if (!/\.(js|zip)$/i.test(f.name)) {
            deobResult.textContent = "Hanya file .js atau .zip yang didukung.";
            deobSetStatus("Invalid", "error");
            return;
        }

        const fd = new FormData();
        fd.append("file", f);

        deobSetStatus("Uploading...", "");
        deobResult.textContent = `Mengirim ${f.name} (${(f.size / 1024).toFixed(1)} KB)...`;
        deobProgress.value = 10;

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/deobfuscate");
        xhr.responseType = "blob";
        xhr.timeout = 15 * 60 * 1000;

        try {
            const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
            if (token) xhr.setRequestHeader("Authorization", "Bearer " + token);
        } catch (e) {}

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 40);
                deobProgress.value = 10 + pct;
                deobResult.textContent = `Uploading... ${Math.round((e.loaded / e.total) * 100)}%`;
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                deobProgress.value = 100;
                deobSetStatus("Done", "success");

                const cd = xhr.getResponseHeader("Content-Disposition") || "";
                const m = cd.match(/filename="?([^"]+)"?/);
                const dlName = m ? m[1] : `deobxata-${f.name}.zip`;

                const url = URL.createObjectURL(xhr.response);
                const a = document.createElement("a");
                a.href = url;
                a.download = dlName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 4000);

                deobResult.textContent = `✅ Selesai: ${dlName}`;
            } else {
                deobProgress.value = 0;
                deobSetStatus("Failed", "error");
                deobResult.textContent = `Error: HTTP ${xhr.status}`;
            }
        };

        xhr.onerror = () => {
            deobProgress.value = 0;
            deobSetStatus("Network error", "error");
            deobResult.textContent = "Gagal menghubungi server.";
        };

        xhr.ontimeout = () => {
            deobProgress.value = 0;
            deobSetStatus("Timeout", "error");
            deobResult.textContent = "Server timeout. Coba file yang lebih kecil.";
        };

        xhr.send(fd);
    });
})();