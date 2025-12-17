const Stats = () => {
  return (
    <section className="bg-white">
      <div className="h-[180px] flex items-center container border-gray-500 border-t-2 border-b-2  mx-auto px-6 md:px-12 lg:px-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Stat 1 - Project Value */}
          <div className="flex items-center justify-center text-center gap-3">
            <div className="text-5xl md:text-6xl font-black text-primary">
              $2M+
            </div>
            <div className="text-sm md:text-base text-gray-700 text-left">
              <span className="font-semibold">Project Value</span> Secured
            </div>
          </div>

          {/* Stat 2 - On-Time Delivery */}
          <div className="flex items-center justify-center text-center gap-3">
            <div className="text-5xl md:text-6xl font-black text-secondary">
              98%
            </div>
            <div className="text-sm md:text-base text-gray-700 text-left">
              <span className="font-semibold">On-Time Delivery</span> Rate
            </div>
          </div>

          {/* Stat 3 - Talent Acceptance */}
          <div className="flex items-center justify-center text-center gap-3">
            <div className="text-5xl md:text-6xl font-black text-secondary">
              Top 3%
            </div>
            <div className="text-sm md:text-base text-gray-700 text-left">
              <span className="font-semibold">Talent Acceptance</span> Rate
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
