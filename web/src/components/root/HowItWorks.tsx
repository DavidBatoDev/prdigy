const steps = [
  {
    number: 1,
    title: "Describe Your Project",
    description: "Tell us about your project idea, goals, and requirements",
  },
  {
    number: 2,
    title: "AI Generates Roadmap",
    description: "Get instant timeline, milestones, and budget breakdown",
  },
  {
    number: 3,
    title: "Present to Consultants",
    description: "Share your roadmap and get matched with expert teams",
  },
];

export const HowItWorks = () => {
  return (
    <div className="mt-32 mb-20">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          From idea to roadmap in minutes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
