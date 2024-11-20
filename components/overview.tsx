import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from 'next-themes'
import Image from 'next/image'

import VisiblWhite from './images/VisiblWhite.svg'
import VisiblBlack from './images/VisiblBlack.svg'

import { MessageIcon } from './icons';

export const Overview = () => {
  const { theme } = useTheme()

  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        {/* <p className="flex flex-row justify-center gap-4 items-center">
          <Image 
            src={theme === 'dark' ? VisiblBlack : VisiblWhite}
            alt="Visibl Logo"
            width={32}
            height={32}
          />
          
          <span>+</span>
          <MessageIcon size={32} />
        </p> */}
        <p className="text-5xl uppercase">
          Visibl Docs Chat
        </p>
        <p>
          Visibl Docs Chat is an AI chatbot interface designed for <u className="font-semibold">semiconductor design</u> documentation. 

          It seamlessly integrates <u className="font-semibold">locally hosted models</u> to prioritize <u className="font-semibold">maximum security and data privacy</u>, making it ideal for sensitive workflows.
        </p>
      </div>
    </motion.div>
  );
};
