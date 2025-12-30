import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import Header from "@/components/layout/Header";
import { Upload, X, CornerDownLeft, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/client/project-posting")({
  component: ProjectPostingPage,
});

type ProjectState = "idea" | "sketches" | "design" | "codebase";

interface FormData {
  // Step 1
  title: string;
  category: string;
  description: string;
  problemSolving: string;
  projectState: ProjectState;
  
  // Step 2
  skills: string[];
  duration: string;
  roadmapFile: File | null;
  
  // Step 3
  budgetRange: string;
  fundingStatus: string;
  startDate: string;
  customStartDate: string;
}

function ProjectPostingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    category: "",
    description: "",
    problemSolving: "",
    projectState: "idea",
    skills: [],
    duration: "1-3_months",
    roadmapFile: null,
    budgetRange: "< $1,000",
    fundingStatus: "",
    startDate: "immediately",
    customStartDate: "",
  });

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    console.log("Submitting project:", formData);
    // TODO: Submit to API
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] relative overflow-hidden">
      <Header />
      
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Wave SVG at bottom */}
        <motion.svg
          className="absolute bottom-0 left-0 w-full h-[700px] opacity-30"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          animate={{
            y: [0, -30, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <motion.path
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,128C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill={currentStep === 1 ? "#FF9933" : currentStep === 2 ? "#e91e63" : "#8b5cf6"}
            fillOpacity="0.3"
            animate={{
              fill: currentStep === 1 ? "#FF9933" : currentStep === 2 ? "#e91e63" : "#8b5cf6",
            }}
            transition={{
              duration: 0.5,
              ease: "easeInOut",
            }}
          />
        </motion.svg>

        {/* Gradient Blobs */}
        <motion.div
          className="absolute top-20 left-10 w-[400px] h-[400px] bg-[#ff993326] rounded-full blur-3xl opacity-40"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-[350px] h-[350px] bg-pink-200 rounded-full blur-3xl opacity-30"
          animate={{
            scale: [1, 1.4, 1],
            x: [0, -40, 0],
            y: [0, 35, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
        <motion.div
          className="absolute bottom-40 left-1/3 w-[300px] h-[300px] bg-orange-200 rounded-full blur-3xl opacity-25"
          animate={{
            scale: [1, 1.5, 1],
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>
      
      <div className="max-w-[1440px] mx-auto px-20 py-8 pb-40 relative z-10">
        {/* Progress Stepper */}
        {/* Progress Stepper */}
        <div className="flex items-center justify-center mb-14 relative">
          <StepIndicator step={1} currentStep={currentStep} label="Vision & Scope" />
          <div className="w-32 h-1 bg-gray-200 rounded-full mx-2 overflow-hidden mt-[-24px]">
             <motion.div 
               className="h-full bg-linear-to-r from-[#ff9933] to-[#e91e63]"
               initial={{ width: "0%" }}
               animate={{ width: currentStep > 1 ? "100%" : "0%" }}
               transition={{ duration: 0.5, ease: "easeInOut" }}
             />
          </div>
          <StepIndicator step={2} currentStep={currentStep} label="Skills & Duration" />
          <div className="w-32 h-1 bg-gray-200 rounded-full mx-2 overflow-hidden mt-[-24px]">
            <motion.div 
               className="h-full bg-[#e91e63]"
               initial={{ width: "0%" }}
               animate={{ width: currentStep > 2 ? "100%" : "0%" }}
               transition={{ duration: 0.5, ease: "easeInOut", delay: 0.1 }}
             />
          </div>
          <StepIndicator step={3} currentStep={currentStep} label="Budget & Timeline" />
        </div>

        {/* Step Content */}
        <div className="grid grid-cols-[400px_1fr] gap-12">
          {/* Left Side - Step Info */}
          <div className="relative">
            <div className="sticky top-[120px]">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1-info"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <h1 className="text-4xl font-bold text-[#333438] mb-4">
                      Step 1: Vision &<br />Scope
                    </h1>
                    <p className="text-[#61636c] text-lg">
                      Tell us what you want to build. You can either answer a few questions or upload an existing RFP/Brief.
                    </p>
                  </motion.div>
                )}
                {currentStep === 2 && (
                  <motion.div
                    key="step2-info"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <h1 className="text-4xl font-bold text-[#333438] mb-4">
                      Step 2: Skills &<br />Deliverables
                    </h1>
                    <p className="text-[#61636c] text-lg">
                      Define the expertise you need and the results you expect.
                    </p>
                  </motion.div>
                )}
                {currentStep === 3 && (
                  <motion.div
                    key="step3-info"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <h1 className="text-4xl font-bold text-[#333438] mb-4">
                      Step 3: Budget &<br />Timeline
                    </h1>
                    <p className="text-[#61636c] text-lg">
                      Help us match you with Consultants who fit your financial and schedule goals.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <Step1
                    formData={formData}
                    updateFormData={updateFormData}
                  />
                </motion.div>
              )}
              {currentStep === 2 && (
                <motion.div
                  key="step2-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <Step2
                    formData={formData}
                    updateFormData={updateFormData}
                  />
                </motion.div>
              )}
              {currentStep === 3 && (
                <motion.div
                  key="step3-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <Step3
                    formData={formData}
                    updateFormData={updateFormData}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Buttons */}
        {/* Navigation Buttons */}
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-8 pt-4 bg-linear-to-t from-[#f6f7f8] via-[#f6f7f8]/80 to-transparent">
          <div className="max-w-[1440px] mx-auto px-6 flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="pointer-events-auto cursor-pointer px-8 py-3 text-[#ff9933] border border-[#ff9933] bg-white rounded-lg font-semibold hover:bg-[#fff5eb] disabled:opacity-30 disabled:cursor-not-allowed transition-colors uppercase shadow-sm"
            >
              Back
            </button>
            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                className="pointer-events-auto cursor-pointer px-8 py-3 bg-linear-to-r from-[#ff9933] to-[#ff6b35] text-white rounded-lg font-semibold hover:shadow-lg transition-all uppercase"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="pointer-events-auto cursor-pointer px-8 py-3 bg-linear-to-r from-[#e91e63] to-[#ff1744] text-white rounded-lg font-semibold hover:shadow-lg transition-all uppercase"
              >
                Submit & Match Consultant
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ step, currentStep, label }: { step: number; currentStep: number; label: string }) {
  const isActive = step === currentStep;
  const isCompleted = step < currentStep;

  // Determine colors based on step state and position
  let bgClass = "bg-gray-200";
  let textClass = "text-gray-400";
  let shadowClass = "";
  let labelClass = "text-gray-400";

  if (isActive || isCompleted) {
    if (step === 1) {
       bgClass = "bg-[#ff9933]";
       textClass = "text-white";
       shadowClass = isActive ? "shadow-[0_0_20px_rgba(255,153,51,0.4)]" : "";
       labelClass = isActive ? "text-[#ff9933] font-semibold" : "text-[#ff9933]";
    } else if (step === 2) {
       bgClass = "bg-[#e91e63]";
       textClass = "text-white";
       shadowClass = isActive ? "shadow-[0_0_20px_rgba(233,30,99,0.4)]" : "";
       labelClass = isActive ? "text-[#e91e63] font-semibold" : "text-[#e91e63]";
    } else {
       bgClass = "bg-[#8b5cf6]";
       textClass = "text-white";
       shadowClass = isActive ? "shadow-[0_0_20px_rgba(139,92,246,0.4)]" : "";
       labelClass = isActive ? "text-[#8b5cf6] font-semibold" : "text-[#8b5cf6]";
    }
  }

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${bgClass} ${textClass} ${shadowClass}`}
        initial={false}
        animate={{
          scale: isActive ? 1.15 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
      >
        <motion.div
          initial={false}
          animate={{
            scale: isCompleted ? [1, 1.2, 1] : 1,
            opacity: isCompleted ? [0, 1] : 1
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut"
          }}
        >
          {isCompleted ? (
            <Check className="w-6 h-6" />
          ) : (
            <span>{step}</span>
          )}
        </motion.div>
      </motion.div>
      <p className={`mt-2 text-xs transition-colors duration-300 ${labelClass}`}>
        {label}
      </p>
    </div>
  );
}

function Step1({ formData, updateFormData }: { formData: FormData; updateFormData: (updates: Partial<FormData>) => void }) {
  const [activeTab, setActiveTab] = useState<"guided" | "upload">("guided");

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("guided")}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === "guided"
              ? "bg-[#ff9933] text-white"
              : "bg-gray-100 text-[#61636c] hover:bg-gray-200"
          }`}
        >
          Guided Form
        </button>
        <button
          onClick={() => setActiveTab("upload")}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === "upload"
              ? "bg-[#ff9933] text-white"
              : "bg-gray-100 text-[#61636c] hover:bg-gray-200"
          }`}
        >
          Upload Document
        </button>
      </div>

      {activeTab === "guided" ? (
        <>
          {/* Project Title & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#333438] mb-2">
                Project Title*
              </label>
              <input
                type="text"
                placeholder="e.g., SaaS Dashboard for Logistics, Food Delivery App..."
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9933] focus:border-transparent shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#333438] mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => updateFormData({ category: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9933] focus:border-transparent shadow-sm"
              >
                <option value="">Select...</option>
                <option value="web">Web Development</option>
                <option value="mobile">Mobile App</option>
                <option value="design">Design</option>
                <option value="data">Data Science</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Project Description */}
          <div>
            <label className="block text-sm font-semibold text-[#333438] mb-2">
              Project Description*
            </label>
            <p className="text-xs text-[#92969f] mb-2">• Describe your vision in a few sentences.</p>
            <textarea
              placeholder="I want to build a mobile app that helps dog walkers find clients..."
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9933] focus:border-transparent resize-none shadow-sm"
            />
          </div>

          {/* Problem Solving */}
          <div>
            <label className="block text-sm text-[#92969f] mb-2">
              What is the main problem you are solving?
            </label>
            <input
              type="text"
              value={formData.problemSolving}
              onChange={(e) => updateFormData({ problemSolving: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9933] focus:border-transparent shadow-sm"
            />
          </div>

          {/* Current State */}
          <div>
            <label className="block text-sm font-semibold text-[#333438] mb-4">
              What is the current state of the project?
            </label>
            <div className="grid grid-cols-2 gap-4">
              <TileOption
                name="projectState"
                value="idea"
                label="Just an idea"
                description="I have a concept but no materials yet"
                checked={formData.projectState === "idea"}
                onChange={() => updateFormData({ projectState: "idea" })}
              />
              <TileOption
                name="projectState"
                value="design"
                label="Design / Prototype ready"
                description="I have designs but need development"
                checked={formData.projectState === "design"}
                onChange={() => updateFormData({ projectState: "design" })}
              />
              <TileOption
                name="projectState"
                value="sketches"
                label="Sketches / Wireframes"
                description="I have rough drawings or flows"
                checked={formData.projectState === "sketches"}
                onChange={() => updateFormData({ projectState: "sketches" })}
              />
              <TileOption
                name="projectState"
                value="codebase"
                label="Existing Codebase"
                description="I need to fix or rebuild an app"
                checked={formData.projectState === "codebase"}
                onChange={() => updateFormData({ projectState: "codebase" })}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-[#61636c] mb-2">
            <span className="text-[#ff9933] font-semibold cursor-pointer hover:underline">Link</span> or drag and drop
          </p>
          <p className="text-sm text-[#92969f]">SVG, PNG, JPG or GIF (max. 3MB)</p>
        </div>
      )}
    </div>
  );
}

function Step2({ formData, updateFormData }: { formData: FormData; updateFormData: (updates: Partial<FormData>) => void }) {
  const [skillInput, setSkillInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  
  const generalSkills = [
    "Graphic Design", "Content Writing", "Web Development", "Data Entry",
    "Digital Marketing", "Project Management", "Translation", "Video Editing",
    "SEO", "Social Media Marketing", "Virtual Assistant", "Illustration",
    "3D Modeling", "Voice Over", "Customer Service", "Accounting",
    "Legal Consulting", "HR & Recruiting", "Photography", "Videography"
  ];

  const filteredSkills = generalSkills.filter(skill => 
    skill.toLowerCase().includes(skillInput.toLowerCase()) && 
    !formData.skills.includes(skill)
  );

  const addSkill = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      updateFormData({ skills: [...formData.skills, skill] });
    }
    setSkillInput("");
    setShowDropdown(false);
  };

  const removeSkill = (skill: string) => {
    updateFormData({ skills: formData.skills.filter((s) => s !== skill) });
  };

  return (
    <div className="space-y-4">
      {/* Skills */}
      <div className="relative">
        <label className="block text-sm font-semibold text-[#333438] mb-2">
          What skills or tools are required?
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search skills (e.g. Graphic Design, Writing)"
            value={skillInput}
            onChange={(e) => {
              setSkillInput(e.target.value);
              setShowDropdown(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && skillInput.trim()) {
                e.preventDefault();
                addSkill(skillInput.trim());
              }
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e91e63] focus:border-transparent mb-4 shadow-sm pr-10"
          />
          <div className={`absolute right-3 top-2.5 transition-colors duration-200 pointer-events-none ${
            skillInput.trim() ? "text-[#ff9933]" : "text-gray-300"
          }`}>
            <CornerDownLeft className="w-5 h-5" />
          </div>
          {showDropdown && skillInput && filteredSkills.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              {filteredSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => addSkill(skill)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[#333438] text-sm transition-colors"
                >
                  {skill}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Skills */}
        <div className="flex flex-wrap gap-2">
          {formData.skills.map((skill) => (
            <div
              key={skill}
              className="px-4 py-1.5 bg-white border border-gray-300 text-[#333438] rounded-full text-sm flex items-center gap-2 shadow-sm cursor-pointer hover:border-red-500 hover:text-red-500 transition-colors group"
              onClick={() => removeSkill(skill)}
            >
              {skill}
              <X className="w-3 h-3 text-gray-400 group-hover:text-red-500 transition-colors" />
            </div>
          ))}
        </div>
        
        {/* Popular Suggestions */}
        <div className="mt-4">
          <p className="text-xs text-[#92969f] mb-2 font-medium">Popular Skills</p>
          <div className="flex flex-wrap gap-2">
            {generalSkills
              .filter(skill => !formData.skills.includes(skill))
              .slice(0, 14)
              .map((skill) => (
                <button
                  key={skill}
                  onClick={() => addSkill(skill)}
                  className="px-3 py-1 bg-white border border-gray-200 text-[#61636c] rounded-full text-xs hover:border-[#ff9933] hover:text-[#ff9933] transition-colors"
                >
                  + {skill}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Expected Duration */}
      <div>
        <label className="block text-sm font-semibold text-[#333438] mb-4">
          Expected Duration
        </label>
        <div className="grid grid-cols-2 gap-4">
          <TileOption
            name="duration"
            value="<1_month"
            label="Less than 1 month"
            checked={formData.duration === "<1_month"}
            onChange={() => updateFormData({ duration: "<1_month" })}
          />
          <TileOption
            name="duration"
            value="1-3_months"
            label="1-3 months"
            checked={formData.duration === "1-3_months"}
            onChange={() => updateFormData({ duration: "1-3_months" })}
          />
          <TileOption
            name="duration"
            value="3-6_months"
            label="3-6 months"
            checked={formData.duration === "3-6_months"}
            onChange={() => updateFormData({ duration: "3-6_months" })}
          />
          <TileOption
            name="duration"
            value="6+_months"
            label="More than 6 months"
            checked={formData.duration === "6+_months"}
            onChange={() => updateFormData({ duration: "6+_months" })}
          />
        </div>
      </div>

      {/* Roadmap Upload */}
      <div>
        <label className="block text-sm font-semibold text-[#333438] mb-2">
          Do you have an existing Roadmap or Timeline? (Optional)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-[#61636c] mb-1">
            <span className="text-[#ff9933] font-semibold cursor-pointer hover:underline">Link</span> or drag and drop
          </p>
          <p className="text-xs text-[#92969f]">SVG, PNG, JPG or GIF (max. 3MB)</p>
          <p className="text-xs text-[#92969f] mt-2 italic">Attach Project Schedule or Gantt Chart (PDF, Excel)</p>
        </div>
      </div>
    </div>
  );
}

function Step3({ formData, updateFormData }: { formData: FormData; updateFormData: (updates: Partial<FormData>) => void }) {
  return (
    <div className="space-y-6">
      {/* Budget Range (repeated from Step 2) */}
      <div>
        <label className="block text-sm font-semibold text-[#333438] mb-4">
          Estimated Budget Range*
        </label>
        <div className="grid grid-cols-2 gap-4">
          <TileOption
            name="budgetRange"
            value="< $1,000"
            label="< $1,000"
            checked={formData.budgetRange === "< $1,000"}
            onChange={() => updateFormData({ budgetRange: "< $1,000" })}
          />
          <TileOption
            name="budgetRange"
            value="$1k - $5k"
            label="$1k - $5k"
            checked={formData.budgetRange === "$1k - $5k"}
            onChange={() => updateFormData({ budgetRange: "$1k - $5k" })}
          />
          <TileOption
            name="budgetRange"
            value="$10k - $50k"
            label="$10k - $50k"
            checked={formData.budgetRange === "$10k - $50k"}
            onChange={() => updateFormData({ budgetRange: "$10k - $50k" })}
          />
          <TileOption
            name="budgetRange"
            value="$50k+"
            label="$50k+"
            checked={formData.budgetRange === "$50k+"}
            onChange={() => updateFormData({ budgetRange: "$50k+" })}
          />
          <div className="flex items-center px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-[#ff9933] transition-colors col-span-2">
            <input
              type="radio"
              name="budgetRange"
              checked={formData.budgetRange === "custom"}
              onChange={() => updateFormData({ budgetRange: "custom" })}
              className="w-5 h-5 text-[#ff9933] focus:ring-[#ff9933]"
            />
            <input
              type="text"
              placeholder="Enter Custom Amount"
              className="ml-3 flex-1 px-3 py-2 border-b border-gray-200 focus:outline-none focus:border-[#ff9933]"
            />
          </div>
        </div>
      </div>

      {/* Funding Status */}
      <div>
        <label className="block text-sm font-semibold text-[#333438] mb-2">
          Funding Status
        </label>
        <select
          value={formData.fundingStatus}
          onChange={(e) => updateFormData({ fundingStatus: e.target.value })}
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9933] focus:border-transparent shadow-sm"
        >
          <option value="">Select...</option>
          <option value="self-funded">Self-funded</option>
          <option value="seed">Seed Round</option>
          <option value="series-a">Series A</option>
          <option value="series-b">Series B+</option>
          <option value="bootstrapped">Bootstrapped</option>
        </select>
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-sm font-semibold text-[#333438] mb-4">
          When do you want to start?*
        </label>
        <div className="grid grid-cols-3 gap-4">
          <TileOption
            name="startDate"
            value="immediately"
            label="Immediately"
            checked={formData.startDate === "immediately"}
            onChange={() => updateFormData({ startDate: "immediately" })}
          />
          <TileOption
            name="startDate"
            value="within-month"
            label="Within a month"
            checked={formData.startDate === "within-month"}
            onChange={() => updateFormData({ startDate: "within-month" })}
          />
          <div className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-[#ff9933] transition-colors">
            <input
              type="radio"
              name="startDate"
              checked={formData.startDate === "custom"}
              onChange={() => updateFormData({ startDate: "custom" })}
              className="w-5 h-5 text-[#ff9933] focus:ring-[#ff9933]"
            />
            <input
              type="date"
              value={formData.customStartDate}
              onChange={(e) => {
                updateFormData({ startDate: "custom", customStartDate: e.target.value });
              }}
              className="ml-3 flex-1 px-2 py-1 border-b border-gray-200 focus:outline-none focus:border-[#ff9933] text-sm"
              placeholder="DD/MM/YY"
            />
          </div>
        </div>
      </div>



      {/* Roadmap Upload */}
      <div>
        <label className="block text-sm font-semibold text-[#333438] mb-2">
          Do you have an existing Roadmap or Timeline? (Optional)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-[#61636c] mb-1">
            <span className="text-[#ff9933] font-semibold cursor-pointer hover:underline">Link</span> or drag and drop
          </p>
          <p className="text-xs text-[#92969f]">SVG, PNG, JPG or GIF (max. 3MB)</p>
          <p className="text-xs text-[#92969f] mt-2 italic">Attach Project Schedule or Gantt Chart (PDF, Excel)</p>
        </div>
      </div>
    </div>
  );
}

function TileOption({
  name,
  value,
  label,
  description,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`relative flex items-start p-4 rounded-xl border-2 transition-all cursor-pointer ${
        checked
          ? "bg-[#fff5eb] border-[#ff9933] shadow-md"
          : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
      }`}
    >
      <div className="flex items-center h-5">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          className="w-5 h-5 text-[#ff9933] focus:ring-[#ff9933]"
        />
      </div>
      <div className="ml-3 text-sm">
        <span className={`font-semibold block ${checked ? "text-[#333438]" : "text-[#61636c]"}`}>
          {label}
        </span>
        {description && <span className="text-xs text-[#92969f] mt-1 block">{description}</span>}
      </div>
    </label>
  );
}
