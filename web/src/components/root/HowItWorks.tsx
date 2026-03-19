const steps = [
  {
    number: 1,
    title: "Describe your project vision",
    description: "Share what you want to build, your goals, and the outcomes you need.",
  },
  {
    number: 2,
    title: "Get matched with expert consultants",
    description: "We align your vision with consultants who can scope and lead execution.",
  },
  {
    number: 3,
    title: "Receive your roadmap",
    description: "Get a structured, consultant-backed roadmap with clear milestones.",
  },
  {
    number: 4,
    title: "Build with vetted freelancers",
    description: "Execute each milestone with specialists matched to the roadmap.",
  },
];

export const HowItWorks = () => {
  return (
    <div className="mt-32 mb-20">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          From idea to roadmap to execution in one guided system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {steps.map((step) => (
          <div key={step.number} className="text-center">
            <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              {step.number}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {step.title}
            </h3>
            <p className="text-gray-600">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
