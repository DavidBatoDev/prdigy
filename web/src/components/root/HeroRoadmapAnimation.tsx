import { motion } from "framer-motion";
import { MousePointer2, Settings, Lock, LayoutDashboard, Check } from "lucide-react";
import { useEffect, useState } from "react";

export const HeroRoadmapAnimation = () => {
  const [animationStep, setAnimationStep] = useState(0);

  // Animation Sequence
  // 0: Initial render (cards visible, no cursor interaction)
  // 1: Cursor moves to second card
  // 2: Cursor clicks (card scales down slightly)
  // 3: Checklist items expand
  // 4: Reset
  useEffect(() => {
    const sequence = async () => {
      // Loop sequence
      while (true) {
        await new Promise((r) => setTimeout(r, 1500)); // Wait before start
        setAnimationStep(1); // Move
        await new Promise((r) => setTimeout(r, 800));
        setAnimationStep(2); // Click
        await new Promise((r) => setTimeout(r, 200));
        setAnimationStep(3); // Expand list
        await new Promise((r) => setTimeout(r, 3000)); // Hold state
        setAnimationStep(4); // Reset phase
        await new Promise((r) => setTimeout(r, 500));
        setAnimationStep(0); // Back to start
      }
    };
    sequence();
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px] lg:h-[550px] rounded-[40px] bg-[#f8fafc] overflow-hidden border border-gray-100 shadow-inner flex items-center justify-center p-8">
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.4]"
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      <div className="relative z-10 w-full max-w-[600px] pl-4">
        {/* Main Connector Line (Vertical) */}
        <div className="absolute left-10 top-8 bottom-8 w-[2px] bg-gray-200 z-0" />

        <div className="flex flex-col space-y-8 w-full">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-start gap-6 relative"
          >
            {/* Connector node */}
            <div className="w-12 h-12 shrink-0 bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center z-10 relative">
              <Settings className="w-6 h-6 text-gray-400" />
            </div>

            {/* Content Card */}
            <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 text-sm">Project Strategy & Scope</h3>
                <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-medium rounded-full uppercase tracking-wider">Completed</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">Define platform access controls, authentication methods, and security protocols.</p>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-500 w-full h-full" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-start gap-6 relative"
          >
            {/* Interactive Connector - This is what gets "clicked" */}
            <motion.div 
              animate={animationStep === 2 ? { scale: 0.95 } : { scale: 1 }}
              className={`w-12 h-12 shrink-0 rounded-2xl shadow-sm border flex items-center justify-center z-10 relative transition-colors duration-300 ${animationStep >= 3 ? 'bg-primary/5 border-primary/20' : 'bg-white border-gray-200'}`}
            >
              <Lock className={`w-6 h-6 ${animationStep >= 3 ? 'text-primary' : 'text-gray-400'}`} />
            </motion.div>

            {/* Content Card container - Expands to show checklist */}
            <div className="flex-1">
              {/* Main Card */}
              <motion.div 
                animate={animationStep === 2 ? { scale: 0.98 } : { scale: 1 }}
                className={`bg-white rounded-2xl p-4 shadow-sm border transition-colors duration-300 relative z-20 ${animationStep >= 3 ? 'border-primary ring-1 ring-primary/20' : 'border-gray-200'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm">Authentication System</h3>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-medium rounded-full uppercase tracking-wider">In Progress</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">Implement secure JWT login, role-based access to dashboards, and token rotation.</p>
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>3 tasks remaining</span>
                  <span>40% done</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div className="bg-amber-400 w-[40%] h-full" />
                </div>
              </motion.div>

              {/* Sub-checklist that appears on click */}
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={
                  animationStep >= 3
                    ? { height: "auto", opacity: 1, marginTop: 8 }
                    : { height: 0, opacity: 0, marginTop: 0 }
                }
                transition={{ duration: 0.3 }}
                className="overflow-hidden bg-white/60 backdrop-blur-sm rounded-xl border border-gray-100 pl-3"
              >
                <div className="p-2.5 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5 text-xs text-gray-600">
                    <div className="w-3.5 h-3.5 rounded bg-green-500 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="line-through opacity-70">Design login UI layout</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-gray-600">
                    <div className="w-3.5 h-3.5 rounded bg-green-500 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="line-through opacity-70">Implement JWT logic</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-medium text-gray-800">
                    <div className="w-3.5 h-3.5 rounded border-2 border-primary shrink-0" />
                    <span>Connect roles to DB</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-start gap-6 relative"
          >
            {/* Connector node */}
            <div className="w-12 h-12 shrink-0 bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center z-10 relative">
              <LayoutDashboard className="w-6 h-6 text-gray-400" />
            </div>

            {/* Content Card */}
            <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-200 opacity-60">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">Admin Dashboard</h3>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full uppercase tracking-wider">Todo</span>
              </div>
              <p className="text-sm text-gray-500">Visual summary analytics formatting and active project routing limits.</p>
            </div>
          </motion.div>
        </div>

        {/* Animated Mouse Cursor */}
        <motion.div
          className="absolute z-50 pointer-events-none"
          initial={{ x: 300, y: 350, opacity: 0 }}
          animate={
            animationStep === 0 || animationStep === 4
              ? { x: 350, y: 400, opacity: 0 }
              : animationStep === 1
              ? { x: 45, y: 155, opacity: 1 } // Position over the middle lock icon
              : (animationStep === 2 || animationStep === 3)
              ? { x: 45, y: 155, scale: 0.9, opacity: 1 } // Click effect
              : {}
          }
          transition={
            animationStep === 1
              ? { duration: 0.8, ease: "easeInOut" }
              : { duration: 0.1 }
          }
        >
          <MousePointer2 className="w-8 h-8 text-gray-800 drop-shadow-md" fill="white" />
        </motion.div>
      </div>
    </div>
  );
};
