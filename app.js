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

document.getElementById("downloadBtn").addEventListener("click",()=>{
  const data = JSON.parse(localStorage.getItem("themeplanner_draft") || "{}");
  const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "themeplanner-wedding-inquiry.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

document.querySelectorAll("[data-go='home']").forEach(el=>el.addEventListener("click",()=>{
  form.style.display = "";
  success.classList.remove("active");
  document.querySelector(".progress").style.display = "";
  currentStep = 1;
  localStorage.setItem("themeplanner_step",1);
  renderStep();
}));

restoreForm();
renderStep();
go("home");
