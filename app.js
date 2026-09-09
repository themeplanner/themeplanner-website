const pages = document.querySelectorAll(".page");
const navItems = document.querySelectorAll("[data-go]");
const steps = [...document.querySelectorAll(".form-step")];
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");
const submitBtn = document.getElementById("submitBtn");
const progressBar = document.getElementById("progressBar");
const stepLabel = document.getElementById("stepLabel");
const progressPct = document.getElementById("progressPct");
const form = document.getElementById("inquiryForm");
const success = document.getElementById("success");

let currentStep = Number(localStorage.getItem("themeplanner_step") || 1);
let inquiryData = JSON.parse(localStorage.getItem("themeplanner_draft") || "{}");

function go(pageId){
  pages.forEach(p => p.classList.toggle("active", p.id === pageId));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.go === pageId));
  window.scrollTo({top:0,behavior:"smooth"});
  if(pageId === "inquiry") renderStep();
}
navItems.forEach(el => el.addEventListener("click",()=>go(el.dataset.go)));

document.querySelector(".brand[data-go='home']")?.addEventListener("keydown",(e)=>{ if(e.key === "Enter" || e.key === " "){ e.preventDefault(); e.currentTarget.click(); }});


/* Custom wedding-date calendar (no native Reset button) */
const calendarPicker = document.getElementById("customDatePicker");
const calendarDisplay = document.getElementById("weddingDateDisplay");
const calendarValue = document.getElementById("weddingDateValue");
const calendarPopover = document.getElementById("calendarPopover");
const calendarMonth = document.getElementById("calendarMonth");
const calendarDays = document.getElementById("calendarDays");
const calendarPrev = document.getElementById("calendarPrev");
const calendarNext = document.getElementById("calendarNext");
const calendarDone = document.getElementById("calendarDone");

let calendarView = new Date();
calendarView.setDate(1);

function pad2(n){ return String(n).padStart(2,"0"); }

function formatDateForDisplay(iso){
  if(!iso) return "";
  const [y,m,d] = iso.split("-").map(Number);
  if(!y || !m || !d) return "";
  return new Date(y,m-1,d).toLocaleDateString(undefined,{
    month:"long", day:"numeric", year:"numeric"
  });
}

function renderCalendar(){
  const year = calendarView.getFullYear();
  const month = calendarView.getMonth();
  calendarMonth.textContent = calendarView.toLocaleDateString(undefined,{month:"long",year:"numeric"});
  calendarDays.innerHTML = "";

  const firstDay = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();

  for(let i=0;i<firstDay;i++){
    const empty = document.createElement("button");
    empty.type = "button";
    empty.className = "empty";
    empty.tabIndex = -1;
    calendarDays.appendChild(empty);
  }

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${pad2(today.getMonth()+1)}-${pad2(today.getDate())}`;

  for(let day=1;day<=daysInMonth;day++){
    const iso = `${year}-${pad2(month+1)}-${pad2(day)}`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = day;
    btn.dataset.date = iso;
    if(iso === calendarValue.value) btn.classList.add("selected");
    if(iso === todayIso) btn.classList.add("today");

    btn.addEventListener("click",()=>{
      calendarValue.value = iso;
      calendarDisplay.value = formatDateForDisplay(iso);
      renderCalendar();
    });
    calendarDays.appendChild(btn);
  }
}

function openCalendar(){
  if(calendarValue.value){
    const [y,m] = calendarValue.value.split("-").map(Number);
    if(y && m) calendarView = new Date(y,m-1,1);
  }
  renderCalendar();
  calendarPopover.hidden = false;
}

function closeCalendar(){
  calendarPopover.hidden = true;
}

calendarDisplay.addEventListener("click",()=>{
  calendarPopover.hidden ? openCalendar() : closeCalendar();
});
calendarPrev.addEventListener("click",()=>{
  calendarView.setMonth(calendarView.getMonth()-1);
  renderCalendar();
});
calendarNext.addEventListener("click",()=>{
  calendarView.setMonth(calendarView.getMonth()+1);
  renderCalendar();
});
calendarDone.addEventListener("click",closeCalendar);

document.addEventListener("click",(e)=>{
  if(calendarPicker && !calendarPicker.contains(e.target)) closeCalendar();
});

function collectForm(){
  const fd = new FormData(form);
  const data = {};
  for(const [key,value] of fd.entries()){
    if(data[key]){
      data[key] = Array.isArray(data[key]) ? [...data[key],value] : [data[key],value];
    } else data[key] = value;
  }
  localStorage.setItem("themeplanner_draft", JSON.stringify(data));
  return data;
}

function restoreForm(){
  Object.entries(inquiryData).forEach(([name,value])=>{
    const vals = Array.isArray(value) ? value : [value];
    const controls = [...form.querySelectorAll(`[name="${CSS.escape(name)}"]`)];
    controls.forEach(c=>{
      if(c.type === "checkbox" || c.type === "radio") c.checked = vals.includes(c.value);
      else c.value = value;
    });
  });
}


function syncWeddingDateDisplay(){
  if(calendarDisplay && calendarValue){
    calendarDisplay.value = formatDateForDisplay(calendarValue.value);
  }
}

function renderStep(){
  steps.forEach((s,i)=>s.classList.toggle("active",i === currentStep-1));
  const pct = Math.round(currentStep / steps.length * 100);
  progressBar.style.width = pct + "%";
  stepLabel.textContent = `STEP ${currentStep} OF ${steps.length}`;
  progressPct.textContent = pct + "%";
  backBtn.style.visibility = currentStep === 1 ? "hidden" : "visible";
  nextBtn.hidden = currentStep === steps.length;
  submitBtn.hidden = currentStep !== steps.length;
}

function validateStep(){
  const active = steps[currentStep-1];
  const required = active.querySelectorAll("[required]");
  for(const el of required){
    if(!el.value.trim()){ el.focus(); return false; }
  }
  return true;
}

nextBtn.addEventListener("click",()=>{
  if(!validateStep()) return;
  collectForm();
  if(currentStep < steps.length){
    currentStep++;
    localStorage.setItem("themeplanner_step",currentStep);
    renderStep();
    window.scrollTo({top:0,behavior:"smooth"});
  }
});

backBtn.addEventListener("click",()=>{
  if(currentStep>1){
    currentStep--;
    localStorage.setItem("themeplanner_step",currentStep);
    renderStep();
    window.scrollTo({top:0,behavior:"smooth"});
  }
});

const WEB3FORMS_ACCESS_KEY = "cecaa0cc-f395-4b54-8931-244b30cd5092";

form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  if(!validateStep()) return;

  inquiryData = collectForm();

  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = "Sending…";

  try {
    const payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: "New Wedding Inquiry — TheMePlanner",
      from_name: inquiryData.name || "Website Visitor",
      replyto: inquiryData.email || "",
      ...inquiryData
    };

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to send inquiry");
    }

    localStorage.setItem("themeplanner_submitted","true");
    form.style.display = "none";
    document.querySelector(".progress").style.display = "none";
    success.classList.add("active");
    window.scrollTo({top:0,behavior:"smooth"});
  } catch (error) {
    console.error("Inquiry submission failed:", error);
    alert("We couldn't send your inquiry right now. Please check your internet connection and try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
});


document.querySelectorAll("[data-go='home']").forEach(el=>el.addEventListener("click",()=>{
  form.style.display = "";
  success.classList.remove("active");
  document.querySelector(".progress").style.display = "";
  currentStep = 1;
  localStorage.setItem("themeplanner_step",1);
  renderStep();
}));

// Always show the landing page after a full browser refresh.
currentStep = 1;
localStorage.setItem("themeplanner_step", 1);
restoreForm();
syncWeddingDateDisplay();
renderStep();
go("home");
