function studentCover() {
  const app = document.querySelector("#app");
  const steps = [
    "Arrival profile",
    "Coverage comparison",
    "Review request",
    "Insurance dashboard",
  ];
  const sva =
    "https://svazurich.ch/unsere-produkte/weitere-produkte/krankenversicherung--kvg-/compulsory-health-insurance/krankenversicherungspflicht-wer-hat-anspruch.html";
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
    example: false,
    tripDays: 7,
    roomDecision: "compare",
    campus,
    profile: {},
    arrival: "",
    needs: ["Liability", "Travel"],
    route: "",
    imported: false,
    replies: {},
    months: 6,
    departure: "",
    customDeparture: false,
    budget: "",
    sampleFound: false,
    evidenceConfirmed: false,
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
    state.sampleFound = false;
    state.evidenceConfirmed = false;
  }
  const sampleStart = "2028-08-01";
  const sampleEnd = "2029-07-31";
  function evidenceReview() {
    return `<section class="evidence"><h3>Policy review assistant</h3><p>Matched to the classroom sample. Check the facts against page 1 before using them.</p>
      <dl class="record"><div><dt>Policy period</dt><dd>1 August 2028 to 31 July 2029</dd></div>
      <div><dt>Territory and duration</dt><dd>“Leisure trips within Europe, including Switzerland, up to 30 days per trip.”</dd></div>
      <div><dt>Insured event</dt><dd>Trip interruption due to illness or injury on a covered leisure trip.</dd></div>
      <div><dt>Benefit limit</dt><dd>CHF 2,000 per trip for eligible unused prepaid costs.</dd></div>
      <div><dt>Exclusions</dt><dd>“Relocation costs, household losses and routine medical treatment.”</dd></div></dl>
      <label><input type="checkbox" id="confirm-evidence" ${state.evidenceConfirmed?"checked":""}> I checked these facts against the sample policy.</label></section>`;
  }
  function addMonths(isoDate, months) {
    const [year,month,day] = isoDate.split("-").map(Number);
    const end = new Date(Date.UTC(year,month+months,0));
    end.setUTCDate(Math.min(day,end.getUTCDate()));
    return end.toISOString().slice(0,10);
  }
  function updateDeparture(form) {
    const {arrival, departure} = form.elements;
    state.arrival = arrival.value;
    if (!state.customDeparture) {
      departure.value = state.arrival ? addMonths(state.arrival,state.months) : "";
    }
    state.departure = departure.value;
    const invalidOrder = state.arrival && state.departure && departure.valueAsNumber <= arrival.valueAsNumber;
    departure.setCustomValidity(invalidOrder ? "Choose a departure date after your arrival." : "");
  }
  function billingMonths() {
    const [startYear,startMonth] = state.arrival.split("-").map(Number);
    const [endYear,endMonth] = state.departure.split("-").map(Number);
    const months = (endYear-startYear)*12 + endMonth-startMonth;
    return months + Number(state.departure > addMonths(state.arrival,months));
  }
  function formatDate(date) {
    return new Date(date+"T12:00:00").toLocaleDateString("en-GB",{dateStyle:"medium"});
  }
  function policyReview() {
    const preview = pdfName
      ? `<p><strong>${escapeText(pdfName)}</strong> · <a href="${photoUrl}" target="_blank" rel="noopener">Read uploaded PDF ↗</a></p>`
      : `<img class="policy-photo" src="${photoUrl}" alt="Your selected contract photo">`;
    return `<details class="card" ${photoUrl || state.sampleFound ? "open" : ""}><summary><strong>Review insurance you already have (optional)</strong></summary>
      <p>Add an existing health, travel, liability or household policy to review what it covers. Your health-insurance answer above guides the exemption checklist. The file stays in this browser.</p>
      <p><a href="Maria-Rossi-sample-travel-policy.pdf" download>Download Maria’s sample travel policy (PDF)</a></p>
      <label class="photo-picker">Choose a contract PDF or photo<input id="policy-photo" type="file" accept=".pdf,application/pdf,image/jpeg,image/png,image/webp"></label>
      <button type="button" class="line" id="load-sample">Open sample in demo</button>
      <p id="photo-message" role="status"></p>
      ${state.sampleFound ? evidenceReview() : ""}
      ${photoUrl || state.sampleFound ? `${photoUrl ? preview : '<p><a href="Maria-Rossi-sample-travel-policy.pdf" target="_blank" rel="noopener">Read sample policy, page 1 ↗</a></p>'}<p>After reading the benefits and exclusions, choose any cover you want to leave out of new quotes.</p><label>Category<select id="existing-category"><option value="">Choose a category…</option>${state.needs.map(k=>`<option>${k}</option>`).join("")}</select></label><button type="button" id="exclude-cover" disabled>Remove from comparison</button><button type="button" class="line" id="close-photo">Remove file</button>` : ""}
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
      let isSample = false;
      if (pdf) {
        if (!(await file.slice(0,5).text()).startsWith("%PDF-")) throw Error();
        if (file.size === 2201 && globalThis.crypto?.subtle) {
          const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()));
          const hash = Array.from(bytes, byte=>byte.toString(16).padStart(2,"0")).join("");
          isSample = hash === "4884dd57db833d34d024913453e78b9826d84a4cc87fbbd7a69fa98b83ca8ced";
        }
      } else {
        const image = new Image();
        image.src = url;
        await image.decode();
      }
      if (version !== photoVersion || state.step !== 0) { URL.revokeObjectURL(url); return; }
      clearPhoto();
      photoUrl = url;
      pdfName = pdf ? file.name : "";
      state.sampleFound = isSample;
      render();
    } catch {
      URL.revokeObjectURL(url);
      if (version === photoVersion) message.textContent = "This file could not be opened. Try another PDF or photo.";
    }
  }
  const plans = {
    Bundle: {name:"Campus Essentials", carrier:"Campus Mutual Insurance", deductible:200, limit:5000},
    Plus: {name:"Campus Plus", carrier:"Alpine Union Insurance", deductible:100, limit:10000},
    Separate: {name:"By coverage category", deductible:300, limit:4000}
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
    return Object.entries(record).map(([k,v])=>`<div><dt>${identity[k] || labels[k] || (k==="departure"?"Departure date":"Arrival date")}</dt><dd>${escapeText(v)}</dd></div>`).join("");
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
    return `<p class="context">${campus || "Zurich"} · Pre-arrival planning</p>
      <h1>Which cover do you need in Zurich?</h1>
      <p class="lead">Maria rents a room from September to February. Her travel policy can help on a weekend away. What happens if her belongings are damaged in the flat?</p>
      <section class="card note"><h2>Work through Maria’s exchange semester</h2><p>Start with her fictional policy and six-month stay. You can change the dates, trip length and cover before choosing a quote.</p>
      <button id="example">Review Maria’s cover →</button></section>
      <button class="line" id="launch">Start with my own details</button>`;
  }
  function semesterEvidence() {
    return `<p class="context">Zurich exchange · Classroom case</p><h1>What follows you to Zurich?</h1>
      <form><div class="card"><h2>Your stay and your trips</h2><p>Maria has Italian health cover, no Swiss job and a room in a shared flat. A leisure trip is a separate journey during the semester.</p>
      <div class="grid"><label>Arrival<input required name="arrival" type="date" value="${state.arrival}"></label>
      <label>Departure<input required name="departure" type="date" value="${state.departure}"></label>
      <label>Longest planned leisure trip (days)<input required id="trip-days" type="number" min="1" step="1" value="${state.tripDays}"></label></div></div>
      <section class="card"><h2>Travel interruption · personal policy</h2><p>1 Aug 2028 – 31 Jul 2029. Eligible European leisure trips, including Switzerland, up to 30 days each. Illness or injury can trigger up to CHF 2,000 for unused prepaid costs. Relocation, household losses and routine treatment are excluded.</p>
      <a href="Maria-Rossi-sample-travel-policy.pdf" target="_blank" rel="noreferrer">Inspect Maria’s sample policy · page 1 ↗</a>
      <p id="trip-finding" role="status"></p><label><input id="confirm-evidence" type="checkbox" ${state.evidenceConfirmed?"checked":""}> Use these sample terms for my comparison</label></section>
      <section class="card"><h2>Does the flat already have cover?</h2><p>The insurer research assistant checked two public AXA pages. Its saved findings are available offline. Retrieved 20 November 2026.</p>
      <dl><dt>Shared household</dt><dd>AXA describes shared policies that cover named residents. Ask the flatmate for the schedule and confirm the address, names and dates with the insurer. Maria’s inclusion is unknown. <a target="_blank" rel="noreferrer" href="https://www.axa.ch/en/privatkunden/blog/at-home/house-and-home/sharing-a-home.html">Sharing a home · Insurance ↗</a></dd>
      <dt>Damage to the rented room</dt><dd>AXA’s tenant liability example includes sudden damage to rented fixtures and excludes the tenant’s own furniture and ordinary wear. Keep liability and personal belongings as separate decisions. <a target="_blank" rel="noreferrer" href="https://www.axa.ch/en/private-customers/offers/property-living/personal-liability-insurance/tenant-liability-insurance.html">Tenant liability · Damage covered ↗</a></dd></dl>
      <label>Household contents<select id="room-decision"><option value="compare">Compare cover for my belongings</option><option value="defer" ${state.roomDecision==="defer"?"selected":""}>Ask my flatmate first · defer household quote</option></select></label><p id="room-finding" role="status"></p></section>
      <p><b>Health cover</b> · Maria needs to check her Italian insurance with SVA Zurich. Only the authority decides her exemption. <a href="${sva}" target="_blank" rel="noreferrer">Official guidance ↗</a></p>
      <button>Build my semester comparison →</button></form>`;
  }
  function updateEvidenceFeedback() {
    app.querySelector("#trip-finding").textContent = tripFeedback();
    const deferred = state.roomDecision === "defer";
    let impact = deferred ? "Household will stay off your quote request. Ask for the flat’s policy schedule." : "Household will be included alongside liability.";
    if (state.arrival && state.departure > state.arrival) {
      const cost = premium("Separate","Household") * billingMonths();
      impact += ` At the sample category rate, household accounts for CHF ${cost} over this stay.`;
    }
    app.querySelector("#room-finding").textContent = impact;
  }
  function tripFits() {
    return state.tripDays > 0 && state.tripDays <= 30 && state.arrival >= sampleStart && state.departure <= sampleEnd && state.arrival < state.departure;
  }
  function tripFeedback() {
    if (!state.tripDays || !state.arrival || !state.departure || state.departure <= state.arrival) return "Enter a valid stay and trip length to check the sample.";
    if (tripFits()) return `A ${state.tripDays}-day leisure trip fits the duration limit. The policy period spans your stay. Confirming the terms leaves extra travel cover out of the starting comparison.`;
    return "Trip length or stay dates exceed the sample terms. Include travel in the comparison and verify the actual trip dates and benefits with the insurer.";
  }
  function profile() {
    if (state.example) return semesterEvidence();
    return `<h1>Your arrival profile</h1>
${campus ? `<section class="card note"><h2>${state.imported ? "Enrolment details imported" : "Preview later integration · use your " + campus + " sample record?"}</h2><p>${state.imported ? "Review your details below and edit anything that has changed." : "Allow StudentCover to fill your given name, family name, email, date of birth, university and programme from the fictional enrolment record. You can also fill the form manually."}</p>${state.imported ? "" : '<button id="import">Allow sample import</button>'}</section>` : ""}
<form><h2>Applicant profile</h2><div class="card grid">${Object.entries(identity).map(([k,label])=>`<label>${label}<input name="${k}" required type="${k==="email"?"email":k==="birth"?"date":"text"}" value="${escapeText(state.profile[k])}"></label>`).join("")}${Object.entries(fields)
      .map(
        ([key, values]) =>
          `<label>${labels[key]}<select required name="${key}"><option value="">Choose…</option>${values.map((v) => `<option ${v === state.profile[key] ? "selected" : ""}>${v}</option>`).join("")}</select></label>`,
      )
      .join(
        "",
      )}<label>Arrival date<input required type="date" name="arrival" value="${state.arrival}"></label><label>Planned stay<select id="stay">${[6,12].map(m=>`<option value="${m}" ${state.months===m?"selected":""}>${m===6?"One semester":"Two semesters"} · ${m} months</option>`).join("")}</select></label><label>Departure date<input required type="date" name="departure" value="${escapeText(state.departure)}" aria-describedby="departure-help"><span class="muted" id="departure-help">Suggested from your arrival date. You can edit it directly.</span></label><label>Budget for this stay (CHF, optional)<input type="number" id="budget" min="1" step="1" value="${escapeText(state.budget)}"></label></div>${policyReview()}<fieldset><legend>Cover to compare</legend>${choices()}</fieldset><button>Compare my cover options →</button></form>`;
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
  function policyFinding() {
    if (!state.sampleFound) return "Add the sample contract or review your own policy in the profile.";
    if (!state.evidenceConfirmed) return "Check the sample policy facts in your arrival profile.";
    const overlapStart = state.arrival > sampleStart ? state.arrival : sampleStart;
    const overlapEnd = state.departure < sampleEnd ? state.departure : sampleEnd;
    if (overlapEnd < overlapStart) return "The sample travel policy period falls outside your stay.";
    const gap = overlapStart > state.arrival || overlapEnd < state.departure;
    return `Eligible leisure trips · ${formatDate(overlapStart)} to ${formatDate(overlapEnd)}. ${gap ? "Some of your stay falls outside the policy period. " : ""}Each trip has a 30-day limit. Relocation costs and routine medical treatment are excluded.`;
  }
  function semesterPlan() {
    const hasHealthRequest = state.requests.some(request=>request.needs.includes("Health"));
    const health = state.exemption === "declined"
      ? hasHealthRequest ? "Refusal recorded · Health quote request added" : "Refusal recorded · Review health cover"
      : state.exemption === "approved" ? "Approval recorded · Check the dates in your decision letter"
      : state.exemption === "pending" ? "Waiting for the authority’s decision" : "Review the official health-insurance guidance";
    return `<section class="card semester-plan" aria-label="Semester coverage plan">
      <div class="stay-dates"><div><small>ARRIVAL</small><strong>${formatDate(state.arrival)}</strong></div><div><small>DEPARTURE</small><strong>${formatDate(state.departure)}</strong></div></div>
      <p class="muted">${billingMonths()} billable months in this estimate</p>
      <dl><dt>Existing cover</dt><dd>${policyFinding()}</dd><dt>Health insurance</dt><dd>${health}</dd>
      <dt>${state.step===3 ? "Cover in this request" : "Shopping for"}</dt><dd>${state.needs.join(", ") || "No new cover selected"}</dd></dl>
    </section>`;
  }
  function assistantChecks() {
    return [
      { name:"Profile assistant", source:state.imported ? state.campus+" sample enrolment and your edits" : "Your arrival profile",
        check:()=>`Checked your arrival and departure dates. The estimate uses ${billingMonths()} billable months.` },
      { name:"Policy assistant", source:state.sampleFound ? "Maria’s sample travel policy · page 1" : "Contract review",
        check:policyFinding },
      { name:"Health assistant", source:"Your profile and recorded exemption status",
        check:()=>state.profile.home !== "Zurich" ? "Check with the canton where you live." : state.exemption === "declined" ? "Refusal recorded. Review your decision letter and compare health cover." : "Zurich residence directs you to SVA Zurich. Your foreign insurance and employment status are inputs for the authority." },
      { name:"Offer assistant", source:"Three fictional plans in the demo catalogue",
        check:()=>state.needs.length ? `Checked ${Object.keys(plans).length} plans for ${state.needs.join(", ")}. ${state.budget ? "Applied your CHF "+state.budget+" budget to the recommendation." : "Used your selected preference to rank the plans."}` : "Choose a coverage category to compare offers." },
    ];
  }
  function assistantEntry({name,source,check}) {
    return `<li><strong>${name}</strong><span class="muted">${source}</span><p>${check()}</p></li>`;
  }
  function assistantPanel() {
    return `<details class="card assistants"><summary>Inspect the checks behind this comparison</summary>
      <ol>${assistantChecks().map(assistantEntry).join("")}</ol><p>Calculated in this browser using your choices and the sample catalogue.</p></details>`;
  }
  function applicantFields() {
    return {...Object.fromEntries([...Object.keys(identity),"school","level","home"].map(k=>[k,state.profile[k]])),arrival:state.arrival,departure:state.departure};
  }
  function receipt(request) {
    if (state.example) return `<section class="card note"><h2>Your sharing receipt</h2><p>You approved a simulated quote request. No data was sent and no payment was taken.</p>${request.recipients.map(r=>`<h3>${r.name} · ${r.categories.join(" + ")}</h3><dl class="record">${recordList(r.fields)}</dl>`).join("")}
      <p>${plans[request.route].name} · CHF ${request.cost} estimated for this request.</p></section>`;
    return `<details class="card"><summary><strong>View submission receipt</strong></summary>
      <p>Demo sharing approved on ${new Date(request.approvedAt).toLocaleString("en-GB")}. ${plans[request.route].name} · Estimated stay total CHF ${request.cost}.</p>
      ${request.recipients.map(({name,categories})=>`<p><b>${name}</b> · ${categories.join(", ")}</p>`).join("")}
      <h3>Applicant fields approved for sharing</h3><dl class="record">${recordList(request.applicant)}</dl>
    </details>`;
  }
  function matchPlan(routes) {
    // All candidates must cover the same basket. Break ties by premium.
    const score = route => {
      if (state.priority === "contact") return providers(route).length;
      if (state.priority === "deductible") return plans[route].deductible;
      return total(route);
    };
    const withinBudget = routes.filter(route=>!state.budget || stayCost(route)<=Number(state.budget));
    const ranked = [...(withinBudget.length ? withinBudget : routes)].sort((a,b)=>score(a)-score(b) || total(a)-total(b));
    const best = ranked[0];
    const reason = state.priority === "contact"
      ? `${providers(best).length} insurer contact for the selected cover. Among plans with that few contacts, this has the lowest premium.`
      : state.priority === "deductible"
        ? `CHF ${plans[best].deductible} per optional-cover claim, the lowest deductible among the plans considered. The premium is CHF ${total(best)} per month.`
        : `CHF ${total(best)} per month, the lowest premium among the plans considered. You would deal with ${providers(best).length} insurer${providers(best).length === 1 ? "" : "s"}.`;
    return `<section class="card note recommendation"><label>What matters most to you?<select id="priority">${[["price","Lowest monthly premium"],["contact","Fewest insurer contacts"],["deductible","Lowest optional-cover deductible"]].filter(([key])=>key!=="deductible" || state.needs.some(k=>k!=="Health")).map(([key,label])=>`<option value="${key}" ${key===state.priority?"selected":""}>${label}</option>`).join("")}</select></label><h2>${plans[best].name} · CHF ${stayCost(best)} for your stay</h2><p>${reason}</p>${state.budget ? `<p>${withinBudget.length ? "Fits your CHF "+state.budget+" budget for this request." : "All sample plans exceed your CHF "+state.budget+" budget for this request."}</p>` : ""}<p>${state.needs.some(k=>k!=="Health") ? "Optional-cover deductible CHF "+plans[best].deductible+" per claim. " : ""}Sample estimate. Confirm the available term and cancellation conditions with the insurer.</p><button data-route="${best}">Review this plan →</button></section>`;
  }
  function coverageNote(){
    if (!state.excluded.length) return "";
    return `<p class="decision-note">Left out after your contract review: <strong>${state.excluded.join(", ")}</strong>. You can still add this cover to the comparison.</p>`;
  }
  function stayCost(route) { return total(route)*billingMonths() + (state.supplement ? 0 : 5*Math.ceil(billingMonths()/6)); }
  function offers() {
    if (!state.needs.length)
      return `<section class="card note"><h2>No new quote selected</h2><p>No premium or service fee is estimated. You can keep your follow-up list without sharing any fields.</p>${state.example ? '<button id="finish-plan">Finish without a quote →</button>' : ""}</section>`;
    const routes = Object.keys(plans);
    const row = (label, cells) => `<tr><th scope="row">${label}</th>${cells.map(c=>`<td>${c}</td>`).join("")}</tr>`;
    const hasOptional = state.needs.some(k=>k !== "Health");
    if (!hasOptional && state.priority === "deductible") state.priority = "price";
    return `${matchPlan(routes)}<div class="compare-scroll" tabindex="0" aria-label="Insurance bundle comparison"><table class="matrix"><caption>Plan names appear across the top. Each coverage row shows the fictional insurance company and its monthly premium.</caption><thead><tr><th scope="col">Compare plans</th>${routes.map(r=>`<th scope="col">${plans[r].name}</th>`).join("")}</tr></thead><tbody>
    ${row("Monthly premium",routes.map(r=>`<strong class="amount">CHF ${total(r)}</strong>`))}
    ${row("Total for "+billingMonths()+" months"+(state.supplement?" (additional)":" incl. service fee"),routes.map(r=>"CHF "+stayCost(r)))}
    ${state.needs.map(k=>row(k,routes.map(r=>`${carrier(r,k)}<br>CHF ${premium(r,k)}/mo`))).join("")}
    ${hasOptional ? row("Optional cover deductible",routes.map(r=>"CHF "+plans[r].deductible+" / claim"))+row("Optional cover limit",routes.map(r=>"CHF "+plans[r].limit.toLocaleString("en-CH")+" / claim")) : ""}
    ${row("Insurer requests",routes.map(r=>providers(r).length))}
    ${row("Your choice",routes.map(r=>`<button data-route="${r}" aria-label="Choose ${plans[r].name}">Choose plan</button>`))}
    </tbody></table></div><p class="muted">Estimates round each started month up to a full month. ${state.supplement ? "Your existing service fee covers this additional request." : "They include one CHF 5 service fee per semester."} Monthly prices are sample premiums. Optional covers exclude intentional damage.</p>`;
  }
  function compare() {
    if (state.supplement) return `<h1>Compare health cover</h1>${semesterPlan()}${assistantPanel()}<p>Separate follow-up request · Your earlier applications remain in your dashboard. Your existing semester service fee also covers this request.</p><section id="offers">${offers()}</section><button id="return-dashboard" class="line">Return to my requests</button>`;
    const summary = state.example ? `<section class="card semester-plan"><h2>${formatDate(state.arrival)} – ${formatDate(state.departure)}</h2><p>${state.evidenceConfirmed ? tripFeedback() : "Travel terms unconfirmed. Review the policy before relying on it."}</p><p>${state.roomDecision === "defer" ? "Follow up with the flatmate about shared household cover." : "Check whether the flat already covers your belongings before buying."} Health exemption remains a separate decision for SVA Zurich.</p></section>` : semesterPlan();
    return `<h1>Your semester coverage plan</h1><button class="line" data-back>Review starting assumptions</button>${summary}${assistantPanel()}<fieldset><legend>Included categories</legend>${choices()}</fieldset><div id="coverage-note">${coverageNote()}</div><section id="offers" aria-live="polite">${offers()}</section>${guidance()}`;
  }
  function exampleReview() {
    const demoEmail = "exchange.student@example.org";
    return `<p class="context">Quote request · Local simulation</p><h1>Approve your request</h1>
      <p class="lead">${plans[state.route].name} · CHF ${stayCost(state.route)} for this stay</p>
      <p>Check each recipient and approve its fields below. Each receives its own categories. The university, your flatmate and SVA Zurich receive nothing.</p>
      <form id="approval">${campus ? `<details><summary>Preview optional university email reuse</summary><p>A later university integration could provide a contact field with permission. The pilot welcome link contains no email.</p><button type="button" class="line" id="reuse-email">Use sample enrolment email · maria.rossi@example.org</button></details>` : ""}<label>Reply email (fictional example)<input required type="email" id="reply-email" value="${escapeText(state.profile.email || demoEmail)}"></label>
      ${providers(state.route).map((name,i)=>`<fieldset><legend>${name}</legend><p>${state.needs.filter(k=>carrier(state.route,k)===name).join(" + ")} · ${formatDate(state.arrival)} to ${formatDate(state.departure)}</p>
      <label><input type="checkbox" name="include-campus-${i}"> Include university for a student-rate enquiry (${campus || "University of Zurich"})</label>
      <label><input required type="checkbox" name="approve-${i}"> Approve reply email, stay dates, selected categories and any field I included for this insurer</label></fieldset>`).join("")}
      <button>Record demo request →</button></form><button data-back class="line">Back to comparison</button>`;
  }
  function review() {
    if (state.example) return exampleReview();
    return `<h1>Review your request</h1><section class="card"><h2>${plans[state.route].name}</h2><p>${state.needs.join(" + ")}</p><p>CHF ${total(state.route)} per month in sample premiums. Estimated cost for ${billingMonths()} billable months: CHF ${stayCost(state.route)}. ${state.supplement ? "Your semester fee is already included in the original request." : "Includes the semester service fee."}</p><h3>Who receives which request?</h3>${providers(
      state.route,
    )
      .map(
        (p) =>
          `<p><b>${p}</b> · ${state.needs.filter((k) => carrier(state.route,k) === p).join(", ")}</p>`,
      )
      .join(
        "",
      )}<h3>Applicant details reused for ${providers(state.route).length} insurer request(s)</h3><dl class="record">${recordList(applicantFields())}</dl><p>Each listed insurer would receive these same applicant details and only its own coverage categories. Your contract file stays in the browser.</p><label><input id="consent" type="checkbox"> I agree to simulate sharing these fields with the listed insurers.</label><button id="submit" disabled>Send demo request</button></section><button class="line" data-back>Back to comparison</button>`;
  }
  function policyDetails(provider,categories,price) {
    const id = "SC-DEMO-" + (state.activeRequest+1) + "-" + String(providers(state.route).indexOf(provider)+1).padStart(3,"0");
    const rows = [["Reference",id],["Policyholder",(state.profile.first ? state.profile.first+" "+state.profile.last : state.profile.email)],["Insurer",provider],["Plan",plans[state.route].name],["Cover",categories.join(", ")],["Premium","CHF "+price+" per month"],["Starts",state.arrival],["End-of-stay cover review",formatDate(state.departure)],["Claims contact","Claims desk at "+provider+" · "+id]];
    const summary = "STUDENTCOVER • FICTIONAL POLICY SUMMARY\n\n" + rows.map(([k,v])=>k+": "+v).join("\n");
    return `<details><summary>Policy details and claims contact</summary><dl class="record">${rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${escapeText(v)}</dd></div>`).join("")}</dl><a download="${id}.txt" href="data:text/plain;charset=utf-8,${encodeURIComponent(summary)}">Download demo policy summary</a></details>`;
  }
  function tracker() {
    if (!state.requests.length) return `<h1>Your semester follow-ups</h1><section class="card note"><h2>No quote requested · CHF 0</h2><p>No recipient or fields approved. You can return to the comparison whenever you want to request cover during this session.</p></section><p>${state.evidenceConfirmed ? policyFinding() : "Check your existing travel policy."}</p><p>Confirm who and what the flat’s policy covers. Ask SVA Zurich about your health cover.</p><button id="resume-comparison">Return to comparison</button>`;
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
    return `<h1>Your requests and next steps</h1>${switcher}${receipt(state.requests[state.activeRequest])}${state.example ? `<p><b>Your next steps</b> · Check your health status with SVA Zurich.${state.roomDecision==="defer" ? " Ask the flatmate for the household policy schedule." : ""} Review each insurer’s terms when its quote arrives.</p>` : semesterPlan()}<p>${issued} of ${count} sample policies issued · ${plans[state.route].name}</p>${cards.join("")}${guidance()}`;
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
    document.querySelector("#steps").innerHTML = ["Welcome", ...(state.example ? ["Existing cover", "Semester comparison", "Sharing permissions", "Requests and next steps"] : steps)]
      .map(
        (s, i) =>
          `<li ${i === state.step + 1 ? 'aria-current="step"' : ""}>${s}</li>`,
      )
      .join("");
    app.innerHTML = state.step === -1 ? welcome() : views[state.step]();
    if (state.example && state.step === 0) updateEvidenceFeedback();
  }
  function go(step) {
    state.step = step;
    render();
    window.scrollTo(0, 0);
    const h = app.querySelector("h1");
    h.tabIndex = -1;
    h.focus();
  }
  app.addEventListener("input", (event) => {
    const field = event.target;
    if (field.id === "reply-email") app.querySelectorAll("[name^=approve-]").forEach(box=>box.checked=false);
    if (field.id === "trip-days") state.tripDays = Number(field.value);
    if (field.name === "departure") state.customDeparture = true;
    if (field.name === "arrival" || field.name === "departure") updateDeparture(field.form);
    if (state.example && state.step === 0) updateEvidenceFeedback();
  });
  app.addEventListener("change", (e) => {
    const t = e.target;
    if (t.name?.startsWith("include-campus-")) t.closest("fieldset").querySelector("[required]").checked = false;
    if (t.id === "room-decision") { state.roomDecision = t.value; updateEvidenceFeedback(); return; }
    if (t.id === "stay") {
      state.months = Number(t.value);
      state.customDeparture = false;
      updateDeparture(t.form);
      return;
    }
    if (t.id === "budget") { state.budget = t.value; return; }
    if (t.id === "confirm-evidence") { state.evidenceConfirmed = t.checked; return; }
    if (t.name === "arrival" || t.name === "departure") {
      if (t.name === "departure") state.customDeparture = true;
      updateDeparture(t.form);
      return;
    }
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
        if (!state.example) document.querySelector(".semester-plan").outerHTML = semesterPlan();
        document.querySelector(".assistants").outerHTML = assistantPanel();
      }
      {
        const select = document.querySelector("#existing-category");
        if (select) {
          select.replaceChildren(new Option("Choose a category…", ""), ...state.needs.map(k=>new Option(k,k)));
          document.querySelector("#exclude-cover").disabled = true;
        }
      }
    } else if (t.name) state.profile[t.name] = t.value;
    else if (t.id === "consent")
      document.querySelector("#submit").disabled = !t.checked;
  });
  app.addEventListener("submit", (e) => {
    e.preventDefault();
    if (e.target.id === "approval") {
      state.profile.email = e.target.querySelector("#reply-email").value;
      const recipients = providers(state.route).map((name,i)=>{
        const fields = {email:state.profile.email,arrival:state.arrival,departure:state.departure};
        if (e.target.elements["include-campus-"+i].checked) fields.school = campus || "University of Zurich";
        return {name,fields,categories:state.needs.filter(k=>carrier(state.route,k)===name)};
      });
      state.requests.push({needs:[...state.needs],route:state.route,replies:{},approvedAt:new Date().toISOString(),cost:stayCost(state.route),recipients});
      openRequest(state.requests.length-1);
      return;
    }
    updateDeparture(e.target);
    if (!e.target.reportValidity()) return;
    if (state.example) {
      state.needs = ["Liability"];
      if (state.roomDecision === "compare") state.needs.push("Household");
      if (!state.evidenceConfirmed || !tripFits()) state.needs.push("Travel");
      state.excluded = state.needs.includes("Travel") ? [] : ["Travel"];
    }
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
    if (t.id === "load-sample") {
      clearPhoto();
      state.sampleFound = true;
      render();
      document.querySelector("#confirm-evidence").focus();
      return;
    }
    if (t.id === "reuse-email") {
      app.querySelector("#reply-email").value = enrolmentRecord().email;
      app.querySelector("#reply-email").dispatchEvent(new Event("input",{bubbles:true}));
      app.querySelector("#reply-email").focus();
      return;
    }
    if (t.id === "finish-plan") { go(3); return; }
    if (t.id === "resume-comparison") { go(1); return; }
    if (t.id === "example") {
      state.example = true;
      state.profile = {home:"Zurich",policy:"Existing cover abroad",work:"No Swiss employment"};
      state.arrival = "2028-09-01";
      state.departure = "2029-03-01";
      state.customDeparture = true;
      state.sampleFound = true;
      go(0);
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
      state.requests.push({
        needs:[...state.needs], route:state.route, replies:state.replies,
        approvedAt:new Date().toISOString(), cost:stayCost(state.route), applicant:applicantFields(),
        recipients:providers(state.route).map(name=>({name,categories:state.needs.filter(category=>carrier(state.route,category)===name)}))
      });
      openRequest(state.requests.length-1);
    }
  });
  document.querySelector("#reset").onclick = () => {
    clearPhoto();
    location.replace("index.html");
  };
  render();
}
studentCover();
