import { motion } from "framer-motion";

const VoiceWaves = () => (
  <div className="flex items-end gap-[3px] h-5">
    {[12, 20, 16].map((h, i) => (
      <motion.div
        key={i}
        className="w-[2px] bg-accent rounded-full"
        animate={{ height: [h * 0.4, h, h * 0.5, h * 0.8, h * 0.4] }}
        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15, ease: "easeInOut" }}
      />
    ))}
  </div>
);

export default VoiceWaves;
