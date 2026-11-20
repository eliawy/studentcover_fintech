const campusPicker = document.querySelector("#campus");
campusPicker.value = new URLSearchParams(location.search).get("campus") === "eth" ? "eth" : "uzh";
function showCampus() {
  const isUZH = campusPicker.value === "uzh";
  const name = isUZH ? "University of Zurich" : "ETH Zurich";
  document.querySelector("#institution").textContent = name;
  document.querySelector("#institution").hidden = !isUZH;
  document.querySelector("#eth-logo").hidden = isUZH;
  document.querySelector("#programme").textContent = isUZH ? "Exchange" : "Master";
  document.querySelector("#launch").href = "studentcover.html?from=" + campusPicker.value;
  document.title = name + " · Pre-arrival checklist (demo)";
}
campusPicker.addEventListener("change", showCampus);
showCampus();
