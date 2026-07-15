import { useRef, useEffect } from "react";
import gsap from "gsap";

const Confetti = ({ active, flag }) => {
    const confettiContainerRef = useRef(null);

    useEffect(() => {
        if (active) {
            const totalConfetti = 50;
            const container = confettiContainerRef.current;

            for (let i = 0; i < totalConfetti; i++) {
                const confetti = document.createElement("div");
                confetti.className = flag; // Define this in your CSS
                container.appendChild(confetti);

                gsap.fromTo(
                    confetti,
                    {
                        x: Math.random() * window.innerWidth,
                        y: -50,
                        rotation: Math.random() * 360,
                        opacity: 1,
                    },
                    {
                        duration: 2 + Math.random() * 2,
                        y: window.innerHeight + 50,
                        rotation: "+=720",
                        opacity: 0,
                        ease: "power1.in",
                        delay: Math.random() * 0.5,
                        onComplete: () => confetti.remove(),
                    },
                );
            }
        }
    }, [active]);

    return <div ref={confettiContainerRef} className="confetti-container"></div>;
};

export default Confetti;
