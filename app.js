function studentCover() {
  const app = document.querySelector("#app");
  const steps = [
    "Arrival profile",
    "Coverage comparison",
    "Review request",
    "Insurance dashboard",
  ];
  const sva =
    "https://svazurich.ch/unsere-produkte/weitere-produkte/krankenversicherung--kvg-/krankenversicherungspflicht0/krankenversicherungspflicht-wer-hat-anspruch.html";
  const fields = {
    school: ["ETH Zurich", "University of Zurich"],
    level: ["Master", "Bachelor", "Exchange", "PhD"],
    home: ["Zurich", "Another canton"],
    policy: ["Existing cover abroad", "No current cover", "Unsure"],
    work: ["No Swiss employment", "Working in Switzerland", "Unsure"],
  };
  const labels = {
    school: "University",
    level: "Programme",
    home: "Canton of residence",
    policy: "Current health insurance",
    work: "Employment",
  };
  const catalogue = {
    Health: [
      60,
      64,
      "Campus Health Insurance",
      "Health benefits subject to official terms",
    ],
    Liability: [8, 6, "Lake Mutual Insurance", "Damage to third-party property"],
    Household: [7, 5, "Lake Mutual Insurance", "Personal belongings at home"],
    Travel: [6, 4, "Transit Travel Insurance", "Trip interruption"],
  };
  const origin = new URLSearchParams(location.search).get("from");
  const campus = origin === "eth" ? "ETH Zurich" : origin === "uzh" ? "University of Zurich" : "";
  const fresh = () => ({
    step: -1,
    campus,
    profile: {},
    arrival: "",
    needs: ["Liability", "Travel"],
    route: "",
    imported: false,
    replies: {},
    months: 6,
    exemption: "prepare",
    requests: [],
    activeRequest: -1,
    supplement: false,
    priority: "price",
    excluded: [],
  });
  let state = fresh();
  let photoUrl = "";
  let pdfName = "";
  let photoVersion = 0;
  function clearPhoto() {
    photoVersion++;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = "";
    pdfName = "";
  }
  function policyReview() {
    const preview = pdfName
      ? `<p><strong>${escapeText(pdfName)}</strong> · <a href="${photoUrl}" target="_blank" rel="noopener">Read uploaded PDF ↗</a></p>`
      : `<img class="policy-photo" src="${photoUrl}" alt="Your selected contract photo">`;
    return `<details class="card" ${photoUrl ? "open" : ""}><summary><strong>Already have a policy? Review your contract</strong></summary>
      <p>Check the coverage you already have, including travel or household insurance. The file stays in this browser.</p>
      <p><a href="Maria-Rossi-sample-travel-policy.pdf" download>Download Maria’s sample travel policy (PDF)</a></p>
      <label class="photo-picker">Choose a contract PDF or photo<input id="policy-photo" type="file" accept=".pdf,application/pdf,image/jpeg,image/png,image/webp"></label>
      <p id="photo-message" role="status"></p>
      ${photoUrl ? `${preview}<p>After reading the benefits and exclusions, choose any cover you want to leave out of new quotes.</p><label>Category<select id="existing-category"><option value="">Choose a category…</option>${state.needs.map(k=>`<option>${k}</option>`).join("")}</select></label><button type="button" id="exclude-cover" disabled>Remove from comparison</button><button type="button" class="line" id="close-photo">Remove file</button>` : ""}
      </details>`;
  }
  async function displayPhoto(file) {
    if (!file) return;
    const version = ++photoVersion;
    const message = document.querySelector("#photo-message");
    const pdf = file.type === "application/pdf" || (!file.type && /\.pdf$/i.test(file.name));
    if ((!pdf && !["image/jpeg","image/png","image/webp"].includes(file.type)) || file.size > 12 * 1024 * 1024) {
      message.textContent = "Choose a PDF, JPG, PNG or WebP file up to 12 MB.";
      return;
    }
    const url = URL.createObjectURL(pdf ? file.slice(0,file.size,"application/pdf") : file);
    try {
      if (pdf) {
        if (!(await file.slice(0,5).text()).startsWith("%PDF-")) throw Error();
      } else {
        const image = new Image();
        image.src = url;
        await image.decode();
      }
      if (version !== photoVersion || state.step !== 0) { URL.revokeObjectURL(url); return; }
      clearPhoto();
      photoUrl = url;
      pdfName = pdf ? file.name : "";
      render();
    } catch {
      URL.revokeObjectURL(url);
      if (version === photoVersion) message.textContent = "This file could not be opened. Try another PDF or photo.";
    }
  }
  const plans = {
    Bundle: {name:"Campus Essentials", carrier:"Campus Mutual Insurance", deductible:200, limit:5000},
    Plus: {name:"Campus Plus", carrier:"Alpine Union Insurance", deductible:100, limit:10000},
    Separate: {name:"Build across insurers", deductible:300, limit:4000}
  };
  function carrier(route, category) { return plans[route].carrier || catalogue[category][2]; }
  function premium(route, category) {
    if (route === "Plus") return catalogue[category][0] + 3;
    return catalogue[category][route === "Bundle" ? 0 : 1];
  }
  function providers(route) { return [...new Set(state.needs.map(k=>carrier(route,k)))]; }
  function total(route) { return state.needs.reduce((sum,k)=>sum+premium(route,k),0); }
  function escapeText(value) {
    return String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  }
  const identity = {first:"Given name", last:"Family name", email:"Contact email", birth:"Date of birth"};
  function enrolmentRecord() {
    return {first:"Maria",last:"Rossi",email:"maria.rossi@example.org",birth:"2004-05-16",school:state.campus,level:programmes[state.campus]};
  }
  function recordList(record) {
    return Object.entries(record).map(([k,v])=>`<div><dt>${identity[k] || labels[k] || "Arrival date"}</dt><dd>${escapeText(v)}</dd></div>`).join("");
  }
  function choices() {
    return `<div class="checks">${Object.keys(catalogue)
      .map(
        (k) =>
          `<label><input type="checkbox" data-need="${k}" ${state.needs.includes(k) ? "checked" : ""}> ${k}</label>`,
      )
      .join("")}</div>`;
  }
  const programmes = { "ETH Zurich": "Master", "University of Zurich": "Exchange" };
  function welcome() {
    return `<p class="context">${campus ? "Referral from " + campus + " enrolment" : "Student insurance"}</p>
      <h1>Insurance for your move to Zurich</h1><p class="lead">Compare student insurance and follow your requests with each insurer here on StudentCover.</p>
      <section class="card note"><h2>Prepare your quote request</h2><p>${campus ? "Use your university profile with permission, or enter your details yourself." : "Start with your details and choose the cover you want to compare."}</p><button id="launch">Start my profile →</button></section>
`;
  }
  function profile() {
    return `<h1>Your arrival profile</h1>
${campus ? `<section class="card note"><h2>${state.imported ? "Enrolment details imported" : "Use your " + campus + " enrolment record?"}</h2><p>${state.imported ? "Review your details below and edit anything that has changed." : "Allow StudentCover to fill your given name, family name, email, date of birth, university and programme from the fictional enrolment record. You can also fill the form manually."}</p>${state.imported ? "" : '<button id="import">Allow sample import</button>'}</section>` : ""}
<form><h2>Applicant profile</h2><div class="card grid">${Object.entries(identity).map(([k,label])=>`<label>${label}<input name="${k}" required type="${k==="email"?"email":k==="birth"?"date":"text"}" value="${escapeText(state.profile[k])}"></label>`).join("")}${Object.entries(fields)
      .map(
        ([key, values]) =>
          `<label>${labels[key]}<select required name="${key}"><option value="">Choose…</option>${values.map((v) => `<option ${v === state.profile[key] ? "selected" : ""}>${v}</option>`).join("")}</select></label>`,
      )
      .join(
        "",
      )}<label>Arrival date<input required type="date" name="arrival" value="${state.arrival}"></label><label>Planned stay<select id="stay">${[6,12].map(m=>`<option value="${m}" ${state.months===m?"selected":""}>${m===6?"One semester":"Two semesters"} · ${m} months</option>`).join("")}</select></label></div>${policyReview()}<fieldset><legend>Cover to compare</legend>${choices()}</fieldset><button>Compare my cover options →</button></form>`;
  }
  function reminder() {
    const arrival = new Date(state.arrival + "T12:00:00");
    if (!Number.isFinite(arrival.getTime())) return "";
    const end = new Date(arrival.getFullYear(), arrival.getMonth() + 4, 0, 12);
    end.setDate(Math.min(arrival.getDate(), end.getDate()));
    return (
      "<p>Planning reminder · " +
      end.toLocaleDateString("en-GB", { dateStyle: "long" }) +
      ". This marks three calendar months from your scenario arrival. Confirm the applicable date with the authority.</p>"
    );
  }
  function exemptionChecklist() {
    if (state.profile.policy !== "Existing cover abroad") return "";
    const stages = {
      prepare: ["Prepare your application", "Review the official instructions and gather the evidence requested for your situation.", '<button data-exemption="pending">I applied with SVA Zurich</button>'],
      pending: ["Waiting for a decision","Record the decision when you receive it directly from SVA Zurich.", '<button data-exemption="approved">Record approval</button><button class="line" data-exemption="declined">Record refusal</button>'],
      approved: ["Approval recorded","Keep the decision letter and check the dates and conditions it specifies.",""],
      declined: ["Refusal recorded","Follow the instructions in your decision letter. You can now compare sample health cover.",'<button id="compare-health">Compare health cover</button>']
    };
    const [title,detail,action] = stages[state.exemption];
    const hasHealthRequest = state.step === 3 && state.requests.some(r=>r.needs.includes("Health"));
    return `<section class="card"><h3>My exemption checklist</h3><p class="muted">Personal record · You apply directly with SVA Zurich.</p><strong>${title}</strong><p>${detail}</p>${hasHealthRequest && state.exemption === "declined" ? '<button id="compare-health">View my health request</button>' : action}${state.exemption !== "prepare" ? '<button class="line" data-exemption="prepare">Reset checklist</button>' : ""}</section>`;
  }
  function guidance() {
    if (state.profile.home !== "Zurich") return '<section class="card note"><h2>Check your health insurance with your canton</h2><p>You selected a residence outside Zurich. Contact the health-insurance office where you will live to check which health cover you need.</p></section>';
    const reason = state.profile.policy === "Existing cover abroad"
      ? "You already have health insurance abroad. Ask SVA Zurich whether you can keep that policy while studying here."
      : state.profile.policy === "Unsure"
        ? "You’re unsure about your current health insurance. Check your policy first, then ask SVA Zurich what you need for your stay."
        : "You reported having no current health insurance. Use SVA Zurich’s guidance to check how to arrange cover.";
    const work = state.profile.work === "Working in Switzerland" ? " Mention your Swiss job when you contact them." : "";
    return `<section class="card note"><h2>Do you need Swiss health insurance?</h2><p>${reason}${work}</p><p>SVA Zurich is the office that decides whether your existing health cover can be accepted.</p><a href="${sva}" target="_blank" rel="noreferrer">Check the official Zurich requirements ↗</a><details><summary>When should I check?</summary>${reminder()}</details>${exemptionChecklist()}</section>`;
  }
  function matchPlan(routes) {
    // All candidates must cover the same basket. Break ties by premium.
    const score = route => {
      if (state.priority === "contact") return providers(route).length;
      if (state.priority === "deductible") return plans[route].deductible;
      return total(route);
    };
    const ranked = [...routes].sort((a,b)=>score(a)-score(b) || total(a)-total(b));
    const best = ranked[0];
    const reason = state.priority === "contact"
      ? `${providers(best).length} insurer contact for the selected cover. Among plans with that few contacts, this has the lowest premium.`
      : state.priority === "deductible"
        ? `CHF ${plans[best].deductible} per optional-cover claim, the lowest sample deductible. The premium is CHF ${total(best)} per month.`
        : `CHF ${total(best)} per month, the lowest sample premium for the selected categories. This choice involves ${providers(best).length} insurer contact(s).`;
    return `<section class="card note"><label>What matters most to you?<select id="priority">${[["price","Lowest monthly premium"],["contact","Fewest insurer contacts"],["deductible","Lowest optional-cover deductible"]].filter(([key])=>key!=="deductible" || state.needs.some(k=>k!=="Health")).map(([key,label])=>`<option value="${key}" ${key===state.priority?"selected":""}>${label}</option>`).join("")}</select></label><h2>${plans[best].name}</h2><p>${reason}</p></section>`;
  }
  function coverageNote(){
    if (!state.excluded.length) return "";
    return `<p class="decision-note">Left out after your contract review: <strong>${state.excluded.join(", ")}</strong>. You can still add this cover to the comparison.</p>`;
  }
  function stayCost(route) { return total(route)*state.months + (state.supplement ? 0 : 5*state.months/6); }
  function offers() {
    if (!state.needs.length)
      return "<p>Select at least one category to compare sample offers. You can still use the official guidance.</p>";
    const routes = Object.keys(plans);
    const row = (label, cells) => `<tr><th scope="row">${label}</th>${cells.map(c=>`<td>${c}</td>`).join("")}</tr>`;
    const hasOptional = state.needs.some(k=>k !== "Health");
    if (!hasOptional && state.priority === "deductible") state.priority = "price";
    return `${matchPlan(routes)}<div class="compare-scroll" tabindex="0" aria-label="Insurance bundle comparison"><table class="matrix"><caption>Plan names appear across the top. Each coverage row shows the fictional insurance company and its monthly premium.</caption><thead><tr><th scope="col">Compare plans</th>${routes.map(r=>`<th scope="col">${plans[r].name}</th>`).join("")}</tr></thead><tbody>
    ${row("Monthly premium",routes.map(r=>`<strong class="amount">CHF ${total(r)}</strong>`))}
    ${row("Total for "+state.months+" months"+(state.supplement?" (additional)":" incl. service fee"),routes.map(r=>"CHF "+stayCost(r)))}
    ${state.needs.map(k=>row(k,routes.map(r=>`${carrier(r,k)}<br>CHF ${premium(r,k)}/mo`))).join("")}
    ${hasOptional ? row("Optional cover deductible",routes.map(r=>"CHF "+plans[r].deductible+" / claim"))+row("Optional cover limit",routes.map(r=>"CHF "+plans[r].limit.toLocaleString("en-CH")+" / claim")) : ""}
    ${row("Insurer requests",routes.map(r=>providers(r).length))}
    ${row("Your choice",routes.map(r=>`<button data-route="${r}" aria-label="Choose ${plans[r].name}">Choose plan</button>`))}
    </tbody></table></div><p class="muted">Stay totals assume full months of cover. ${state.supplement ? "Your existing service fee covers this additional request." : "They include one CHF 5 service fee per semester."} Monthly prices are sample premiums. Optional covers exclude intentional damage.</p>`;
  }
  function compare() {
    if (state.supplement) return `<h1>Compare health cover</h1><p>Separate follow-up request · Your earlier applications remain in your dashboard. Your existing semester service fee also covers this request.</p><section id="offers">${offers()}</section><button id="return-dashboard" class="line">Return to my requests</button>`;
    return `<h1>Compare insurance bundles</h1><fieldset><legend>Included categories</legend>${choices()}</fieldset><div id="coverage-note">${coverageNote()}</div><section id="offers" aria-live="polite">${offers()}</section>${guidance()}<button class="line" data-back>Open arrival profile</button>`;
  }
  function review() {
    return `<h1>Review your request</h1><section class="card"><h2>${plans[state.route].name}</h2><p>${state.needs.join(" + ")}</p><p>CHF ${total(state.route)} per month in sample premiums. Estimated cost for ${state.months} months: CHF ${stayCost(state.route)}. ${state.supplement ? "Your semester fee is already included in the original request." : "Includes the semester service fee."}</p><h3>Who receives which request?</h3>${providers(
      state.route,
    )
      .map(
        (p) =>
          `<p><b>${p}</b> · ${state.needs.filter((k) => carrier(state.route,k) === p).join(", ")}</p>`,
      )
      .join(
        "",
      )}<h3>Applicant details reused for ${providers(state.route).length} insurer request(s)</h3><dl class="record">${recordList(Object.fromEntries([...Object.keys(identity),"school","level","home"].map(k=>[k,state.profile[k]]).concat([["arrival",state.arrival]])))}</dl><p>Each listed insurer would receive these same applicant details and only its own coverage categories. Your contract file stays in the browser.</p><label><input id="consent" type="checkbox"> I agree to simulate sharing these fields with the listed insurers.</label><button id="submit" disabled>Send demo request</button></section><button class="line" data-back>Back to comparison</button>`;
  }
  function policyDetails(provider,categories,price) {
    const start = new Date(state.arrival + "T12:00:00");
    const renewal = new Date(start.getFullYear(),start.getMonth()+state.months+1,0,12);
    renewal.setDate(Math.min(start.getDate(),renewal.getDate()));
    const id = "SC-DEMO-" + (state.activeRequest+1) + "-" + String(providers(state.route).indexOf(provider)+1).padStart(3,"0");
    const rows = [["Reference",id],["Policyholder",state.profile.first+" "+state.profile.last],["Insurer",provider],["Plan",plans[state.route].name],["Cover",categories.join(", ")],["Premium","CHF "+price+" per month"],["Starts",state.arrival],["End-of-stay cover review",renewal.toLocaleDateString("en-GB",{dateStyle:"long"})],["Claims contact","Claims desk at "+provider+" · "+id]];
    const summary = "STUDENTCOVER • FICTIONAL POLICY SUMMARY\n\n" + rows.map(([k,v])=>k+": "+v).join("\n");
    return `<details><summary>Policy details and claims contact</summary><dl class="record">${rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${escapeText(v)}</dd></div>`).join("")}</dl><a download="${id}.txt" href="data:text/plain;charset=utf-8,${encodeURIComponent(summary)}">Download demo policy summary</a></details>`;
  }
  function tracker() {
    const cards = providers(state.route).map((provider) => {
      const categories = state.needs.filter((k) => carrier(state.route,k) === provider);
      const price = categories.reduce((sum,k) => sum + premium(state.route,k), 0);
      const stage = state.replies[provider] || "submitted";
      const workflow = {
        submitted: ["Submitted", `<p>${provider} is reviewing your demo request.</p><button class="line" data-event="request" data-provider="${provider}">Simulate insurer asking for start date</button>`],
        requested: ["Action needed", `<p>${provider} asks: “Should the quote start on your planned arrival date, ${state.arrival}?”</p><button data-event="confirm" data-provider="${provider}">Confirm start date</button>`],
        confirmed: ["Start date confirmed", `<p>You confirmed ${state.arrival}. The insurer can now prepare your quote.</p><button class="line" data-event="quote" data-provider="${provider}">Simulate insurer issuing quote</button>`],
        quoted: ["Quote ready", `<p>Sample quote for cover starting ${state.arrival}: CHF ${price} per month. This quotation provides no active coverage.</p><button data-event="accept" data-provider="${provider}">Accept sample quote</button>`],
        accepted: ["Awaiting policy", `<p>You accepted the quote. ${provider} still needs to issue the sample policy.</p><button class="line" data-event="issue" data-provider="${provider}">Simulate policy issuance</button>`],
        issued: ["Policy issued", policyDetails(provider,categories,price)],
      };
      const [status, action] = workflow[stage];
      return `<section class="card"><small>${status}</small><h2>${provider}</h2><p>${categories.join(", ")} · Sample quotation request</p>${action}</section>`;
    });
    const count = providers(state.route).length;
    const issued = Object.values(state.replies).filter(s=>s==="issued").length;
    const switcher = state.requests.length > 1 ? `<label>View request<select id="request-switch">${state.requests.map((r,i)=>`<option value="${i}" ${i===state.activeRequest?"selected":""}>Request ${i+1} · ${r.needs.join(" + ")}</option>`).join("")}</select></label>` : "";
    return `<h1>Your insurance dashboard</h1>${switcher}<p>${issued} of ${count} sample policies issued · ${plans[state.route].name}</p>${cards.join("")}${guidance()}`;
  }
  function openRequest(index) {
    state.activeRequest = index;
    Object.assign(state,state.requests[index]);
    state.supplement = false;
    go(3);
  }
  const views = [profile, compare, review, tracker];
  function render() {
    document.querySelector("#campus-return").href = "index.html" + (campus ? "?campus=" + origin : "");
    document.querySelector("#steps").innerHTML = ["Welcome", ...steps]
      .map(
        (s, i) =>
          `<li ${i === state.step + 1 ? 'aria-current="step"' : ""}>${s}</li>`,
      )
      .join("");
    app.innerHTML = state.step === -1 ? welcome() : views[state.step]();
  }
  function go(step) {
    clearPhoto();
    state.step = step;
    render();
    window.scrollTo(0, 0);
    const h = app.querySelector("h1");
    h.tabIndex = -1;
    h.focus();
  }
  app.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "stay") { state.months = Number(t.value); return; }
    if (t.id === "request-switch") { openRequest(Number(t.value)); return; }
    if (t.id === "priority") {
      state.priority = t.value;
      document.querySelector("#offers").innerHTML = offers();
      document.querySelector("#priority").focus();
      return;
    }
    if (t.id === "policy-photo") { displayPhoto(t.files[0]); return; }
    if (t.id === "existing-category") { document.querySelector("#exclude-cover").disabled = !t.value; return; }
    if (t.dataset.need) {
      state.needs = t.checked
        ? [...state.needs, t.dataset.need]
        : state.needs.filter((k) => k !== t.dataset.need);
      if (t.checked) state.excluded = state.excluded.filter(k=>k !== t.dataset.need);
      if (state.step === 1) {
        document.querySelector("#offers").innerHTML = offers();
        document.querySelector("#coverage-note").innerHTML = coverageNote();
      }
      {
        const select = document.querySelector("#existing-category");
        if (select) {
          select.replaceChildren(new Option("Choose a category…", ""), ...state.needs.map(k=>new Option(k,k)));
          document.querySelector("#exclude-cover").disabled = true;
        }
      }
    } else if (t.name === "arrival") state.arrival = t.value;
    else if (t.name) state.profile[t.name] = t.value;
    else if (t.id === "consent")
      document.querySelector("#submit").disabled = !t.checked;
  });
  app.addEventListener("submit", (e) => {
    e.preventDefault();
    go(1);
  });
  app.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.exemption) { state.exemption = t.dataset.exemption; render(); return; }
    if (t.id === "return-dashboard") { openRequest(state.activeRequest); return; }
    if (t.id === "compare-health") {
      if (state.step === 3) {
        const existing = state.requests.findIndex(r=>r.needs.includes("Health"));
        if (existing >= 0) { openRequest(existing); return; }
        state.supplement = true;
        state.needs = ["Health"];
        state.replies = {};
      } else if (!state.needs.includes("Health")) state.needs.push("Health");
      state.excluded = state.excluded.filter(k=>k!=="Health");
      go(1);
      return;
    }
    if (t.id === "launch") { go(0); return; }
    if (t.id === "close-photo") {
      clearPhoto();
      render();
    } else if (t.id === "exclude-cover") {
      const category = document.querySelector("#existing-category").value;
      if (!state.needs.includes(category)) return;
      state.needs = state.needs.filter(k=>k !== category);
      state.excluded.push(category);
      render();
      document.querySelector("#photo-message").textContent = category + " removed from the cover you will compare.";
    } else if (t.id === "import") {
      state.imported = true;
      Object.assign(state.profile, enrolmentRecord());
      render();
    } else if (t.dataset.event && state.step === 3) {
      const next = { submitted: ["request","requested"], requested: ["confirm","confirmed"], confirmed: ["quote","quoted"], quoted: ["accept","accepted"], accepted: ["issue","issued"] };
      const provider = t.dataset.provider;
      const transition = next[state.replies[provider] || "submitted"];
      if (!providers(state.route).includes(provider) || transition?.[0] !== t.dataset.event) return;
      state.replies[provider] = transition[1];
      render();
    } else if (t.dataset.route) {
      state.route = t.dataset.route;
      go(2);
    } else if (t.hasAttribute("data-back")) go(state.step - 1);
    else if (t.id === "submit" && document.querySelector("#consent").checked) {
      state.requests.push({needs:[...state.needs],route:state.route,replies:state.replies});
      openRequest(state.requests.length-1);
    }
  });
  document.querySelector("#reset").onclick = () => {
    state = fresh();
    go(-1);
  };
  render();
}
studentCover();
