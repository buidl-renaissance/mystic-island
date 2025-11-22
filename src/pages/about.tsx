import Head from "next/head";
import styled, { keyframes } from "styled-components";
import { Cinzel, Cormorant_Garamond, Inter, Merriweather_Sans } from "next/font/google";

// Fonts
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const merriweather = Merriweather_Sans({
  subsets: ["latin"],
  variable: "--font-merriweather",
  display: "swap",
});

// Color Palette - Darker for better contrast
const colors = {
  emeraldSpirit: "#2D5A3D",
  deepForest: "#0A1410",
  sunlitGold: "#E8A855",
  skyDawn: "#4A7A9A",
  lotusPink: "#B85A8F",
  sunsetOrange: "#C76A2A",
  orchidPurple: "#5A3F8F",
  jungleCyan: "#4A9A7A",
  textPrimary: "#F5F5F5",
  textSecondary: "#D0D0D0",
  textMuted: "#A0A0A0",
};

// Animations
const drift = keyframes`
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(30px, -30px); }
  66% { transform: translate(-20px, 20px); }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const gentleFloat = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const bloom = keyframes`
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.05);
    filter: brightness(1.2);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
`;

const ripple = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
`;

// Base Components
const PageContainer = styled.div`
  background: 
    linear-gradient(180deg, rgba(26, 47, 26, 0.4) 0%, rgba(45, 74, 45, 0.3) 25%, rgba(30, 58, 30, 0.35) 50%, rgba(15, 42, 15, 0.5) 75%, rgba(10, 26, 10, 0.6) 100%),
    url('/images/luma.png') center center / cover no-repeat fixed;
  color: #ffffff;
  font-family: var(--font-inter), var(--font-merriweather), sans-serif;
  overflow-x: hidden;
  position: relative;

  @media (max-width: 768px) {
    background: 
      linear-gradient(180deg, rgba(26, 47, 26, 0.4) 0%, rgba(45, 74, 45, 0.3) 25%, rgba(30, 58, 30, 0.35) 50%, rgba(15, 42, 15, 0.5) 75%, rgba(10, 26, 10, 0.6) 100%),
      url('/images/luma-tall-2.png') center right / cover no-repeat fixed;
  }

  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(ellipse at 30% 20%, rgba(255, 215, 0, 0.05) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 80%, rgba(100, 255, 218, 0.04) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(255, 182, 193, 0.03) 0%, transparent 70%);
    pointer-events: none;
    z-index: 1;
  }

  &::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.65);
    pointer-events: none;
    z-index: 1;
  }
`;

const ParticleContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
`;

const Particle = styled.div<{ delay: number; duration: number; x: number; y: number }>`
  position: absolute;
  width: 6px;
  height: 6px;
  background: rgba(144, 238, 144, 0.7);
  border-radius: 50%;
  animation: ${drift} ${props => props.duration}s infinite ease-in-out;
  animation-delay: ${props => props.delay}s;
  left: ${props => props.x}%;
  top: ${props => props.y}%;
  box-shadow: 0 0 15px rgba(144, 238, 144, 0.9), 0 0 30px rgba(255, 215, 0, 0.3);
`;

const Section = styled.section`
  width: 100%;
  padding: 80px 24px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    padding: 60px 20px;
  }
`;

const HeroSection = styled(Section)`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 4rem 2rem;
  position: relative;
  z-index: 2;
  opacity: 0;
  animation: ${fadeIn} 1.5s ease-in-out forwards;
  animation-delay: 1s;

  @media (min-width: 768px) {
    justify-content: center;
  }
`;

const HeroTitle = styled.h1`
  font-family: var(--font-cinzel), var(--font-cormorant), serif;
  font-size: 64px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 24px;
  color: ${colors.sunlitGold};
  letter-spacing: -1px;
  text-shadow: 0 2px 20px rgba(242, 182, 99, 0.3);
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    font-size: 40px;
    letter-spacing: -0.5px;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 22px;
  line-height: 1.8;
  color: ${colors.textSecondary};
  max-width: 800px;
  margin: 0 auto 48px;
  position: relative;
  z-index: 2;
  text-shadow: 0 2px 15px rgba(0, 0, 0, 0.8);

  @media (max-width: 768px) {
    font-size: 18px;
    margin-bottom: 32px;
  }
`;

const SectionTitle = styled.h2`
  font-family: var(--font-cinzel), var(--font-cormorant), serif;
  font-size: 48px;
  font-weight: 600;
  margin-bottom: 24px;
  color: ${colors.sunlitGold};
  text-shadow: 0 2px 15px rgba(242, 182, 99, 0.2);
  position: relative;

  @media (max-width: 768px) {
    font-size: 32px;
  }
`;

const SectionSubtitle = styled.p`
  font-size: 20px;
  line-height: 1.8;
  color: ${colors.textSecondary};
  max-width: 800px;
  margin: 0 auto 48px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  margin-top: 48px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const Card = styled.div`
  padding: 32px;
  background: linear-gradient(135deg, rgba(45, 90, 61, 0.15) 0%, rgba(10, 20, 16, 0.25) 100%);
  border: 2px solid ${colors.emeraldSpirit};
  border-radius: 24px;
  transition: all 0.5s ease;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);

  &::before {
    content: "";
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(
      45deg,
      ${colors.emeraldSpirit},
      ${colors.jungleCyan},
      ${colors.emeraldSpirit}
    );
    border-radius: 24px;
    opacity: 0;
    transition: opacity 0.5s ease;
    z-index: -1;
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 40px rgba(63, 127, 82, 0.3), 0 0 20px rgba(101, 201, 166, 0.2);
    border-color: ${colors.jungleCyan};

    &::before {
      opacity: 0.3;
    }
  }
`;

const CardTitle = styled.h3`
  font-family: var(--font-cormorant), serif;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${colors.sunlitGold};
`;

const CardText = styled.p`
  font-size: 16px;
  line-height: 1.8;
  color: ${colors.textSecondary};
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 24px 0;
`;

const FeatureItem = styled.li`
  font-size: 18px;
  line-height: 2;
  color: ${colors.textSecondary};
  margin-bottom: 12px;
  padding-left: 32px;
  position: relative;

  &::before {
    content: "🌿";
    position: absolute;
    left: 0;
    font-size: 20px;
    filter: drop-shadow(0 0 4px ${colors.jungleCyan});
  }
`;

const StepContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 48px;
  margin-top: 48px;
`;

const Step = styled.div`
  display: flex;
  gap: 32px;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 24px;
  }
`;

const StepNumber = styled.div<{ delay?: number }>`
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, ${colors.emeraldSpirit} 0%, ${colors.sunlitGold} 100%);
  color: ${colors.deepForest};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 700;
  box-shadow: 0 4px 20px rgba(242, 182, 99, 0.4);
  animation: ${gentleFloat} 4s ease-in-out infinite;
  animation-delay: ${(props) => (props.delay || 0) * 0.5}s;
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h3`
  font-family: var(--font-cormorant), serif;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${colors.sunlitGold};
`;

const StepText = styled.p`
  font-size: 18px;
  line-height: 1.8;
  color: ${colors.textSecondary};
`;

const IconGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 24px;
  margin: 32px 0;
`;

const IconItem = styled.div`
  text-align: center;
  padding: 32px 24px;
  background: linear-gradient(135deg, rgba(45, 90, 61, 0.15) 0%, rgba(10, 20, 16, 0.2) 100%);
  border: 1px solid ${colors.emeraldSpirit};
  border-radius: 20px;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: radial-gradient(circle, ${colors.orchidPurple} 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
    opacity: 0.3;
  }

  &:hover {
    transform: translateY(-4px);
    border-color: ${colors.orchidPurple};
    box-shadow: 0 8px 30px rgba(108, 75, 175, 0.3);

    &::before {
      width: 200px;
      height: 200px;
    }
  }
`;

const Icon = styled.div<{ delay?: number }>`
  font-size: 48px;
  margin-bottom: 12px;
  filter: drop-shadow(0 0 8px ${colors.sunlitGold});
  animation: ${gentleFloat} 5s ease-in-out infinite;
  animation-delay: ${(props) => (props.delay || 0) * 0.3}s;
`;

const IconLabel = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${colors.sunlitGold};
`;

const TechGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-top: 32px;
`;

const TechItem = styled.div`
  padding: 24px;
  background: linear-gradient(135deg, rgba(45, 90, 61, 0.15) 0%, rgba(10, 20, 16, 0.2) 100%);
  border: 1px solid ${colors.emeraldSpirit};
  border-radius: 16px;
  text-align: center;
  transition: all 0.4s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: ${colors.jungleCyan};
    box-shadow: 0 8px 25px rgba(101, 201, 166, 0.2);
  }
`;

const TechName = styled.div`
  font-family: var(--font-cormorant), serif;
  font-size: 18px;
  font-weight: 600;
  color: ${colors.sunlitGold};
  margin-bottom: 8px;
`;

const TechDesc = styled.div`
  font-size: 14px;
  color: ${colors.textMuted};
  line-height: 1.6;
`;

const HighlightBox = styled.div`
  background: linear-gradient(135deg, rgba(45, 90, 61, 0.2) 0%, rgba(10, 20, 16, 0.3) 100%);
  border-left: 4px solid ${colors.sunlitGold};
  padding: 32px;
  border-radius: 16px;
  margin: 32px 0;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, ${colors.orchidPurple} 0%, transparent 70%);
    opacity: 0.1;
    animation: ${drift} 15s ease-in-out infinite;
  }
`;

const HighlightText = styled.p`
  font-size: 18px;
  line-height: 1.8;
  color: ${colors.textPrimary};
  margin: 0;
  position: relative;
  z-index: 1;

  strong {
    color: ${colors.sunlitGold};
    font-weight: 600;
  }
`;

const PrimaryButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16px 32px;
  background: linear-gradient(135deg, ${colors.emeraldSpirit} 0%, ${colors.sunlitGold} 100%);
  color: ${colors.deepForest};
  border-radius: 40px;
  font-weight: 600;
  font-size: 16px;
  text-decoration: none;
  transition: all 0.4s ease;
  cursor: pointer;
  border: none;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(45, 90, 61, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3);

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  &:hover {
    background: linear-gradient(135deg, ${colors.sunsetOrange} 0%, ${colors.sunlitGold} 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 30px rgba(233, 138, 58, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3);
    animation: ${bloom} 0.6s ease;
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 10px rgba(63, 127, 82, 0.3);
  }

  &:active::before {
    width: 300px;
    height: 300px;
    animation: ${ripple} 0.6s ease-out;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 48px;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
`;

const Footer = styled.footer`
  background: ${colors.deepForest};
  color: #ffffff;
  padding: 60px 24px 40px;
  margin-top: 80px;
  position: relative;
  border-top: 2px solid ${colors.emeraldSpirit};
  z-index: 2;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      ${colors.emeraldSpirit},
      ${colors.jungleCyan},
      ${colors.emeraldSpirit},
      transparent
    );
  }
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
`;

const FooterSection = styled.div``;

const FooterTitle = styled.h4`
  font-family: var(--font-cormorant), serif;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${colors.sunlitGold};
`;

const FooterLink = styled.a`
  display: block;
  color: ${colors.textMuted};
  text-decoration: none;
  margin-bottom: 12px;
  transition: all 0.3s ease;
  position: relative;
  padding-left: 0;

  &::before {
    content: "→";
    position: absolute;
    left: -20px;
    opacity: 0;
    transition: all 0.3s ease;
    color: ${colors.jungleCyan};
  }

  &:hover {
    color: ${colors.sunlitGold};
    padding-left: 20px;

    &::before {
      opacity: 1;
      left: 0;
    }
  }
`;

const FooterBottom = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 40px;
  border-top: 1px solid rgba(45, 90, 61, 0.4);
  text-align: center;
  color: ${colors.textMuted};
`;

const BodyText = styled.p`
  font-size: 18px;
  line-height: 1.9;
  color: ${colors.textSecondary};
  margin-bottom: 24px;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.5);

  @media (max-width: 768px) {
    font-size: 16px;
    line-height: 1.8;
  }
`;

const BodyTextLarge = styled(BodyText)`
  font-size: 20px;
  line-height: 2;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const Emoji = styled.span`
  font-size: 1.2em;
  margin-right: 8px;
  filter: drop-shadow(0 0 4px ${colors.sunlitGold});
`;

const UnorderedList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 24px 0;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const ListItem = styled.li`
  font-size: 18px;
  line-height: 2;
  color: ${colors.textSecondary};
  margin-bottom: 16px;
  padding-left: 32px;
  position: relative;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.5);

  &::before {
    content: "→";
    position: absolute;
    left: 0;
    color: ${colors.jungleCyan};
    font-weight: 600;
    filter: drop-shadow(0 0 4px ${colors.jungleCyan});
  }

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const IntroText = styled(BodyTextLarge)`
  font-size: 22px;
  line-height: 1.9;
  margin-bottom: 32px;
  text-align: center;
  color: ${colors.textPrimary};

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const RealmExamples = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin: 32px 0;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const RealmExample = styled.div`
  padding: 16px;
  background: linear-gradient(135deg, rgba(45, 90, 61, 0.1) 0%, rgba(10, 20, 16, 0.15) 100%);
  border: 1px solid ${colors.emeraldSpirit};
  border-radius: 12px;
  text-align: center;
  font-size: 16px;
  color: ${colors.textSecondary};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: ${colors.jungleCyan};
    box-shadow: 0 8px 25px rgba(101, 201, 166, 0.2);
  }
`;

export default function About() {
  return (
    <>
      <Head>
        <title>About the Myth Network – A Living Universe Shaped by Communities</title>
        <meta
          name="description"
          content="The Myth Network is the mythic, game-driven layer of the Your Land Network—a living universe shaped by collective imagination where communities create realms, build totems, and form alliances."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PageContainer className={`${cinzel.variable} ${cormorant.variable} ${inter.variable} ${merriweather.variable}`}>
        {/* Hero Section */}
        <HeroSection>
          <ParticleContainer>
            {Array.from({ length: 15 }).map((_, i) => (
              <Particle
                key={i}
                delay={i * 0.5}
                duration={10 + Math.random() * 10}
                x={Math.random() * 100}
                y={Math.random() * 100}
              />
            ))}
          </ParticleContainer>
          <HeroTitle>🌌 About the Myth Network</HeroTitle>
          <HeroSubtitle>
            Communities forge their own realms, power up shared totems, and open portals to collaborate and grow across worlds.
          </HeroSubtitle>
        </HeroSection>

        {/* What Is the Myth Network? */}
        <Section id="what-is">
          <SectionTitle>What Is the Myth Network?</SectionTitle>
          <BodyTextLarge>
            The Myth Network is the mythic, game-driven layer of the Your Land Network—a living universe shaped by collective imagination.
          </BodyTextLarge>
          <BodyText>
            It's where communities come together to create realms, build shared totems fueled by their creativity, and form alliances across worlds through portals.
          </BodyText>
          <BodyText>
            In the Myth Network, every community is more than a group of people.
          </BodyText>
          <HighlightBox>
            <HighlightText>
              <strong>It is a tribe, a realm, and a mythic force that grows through collaboration.</strong>
            </HighlightText>
          </HighlightBox>
        </Section>

        {/* A Living Universe Shaped by Communities */}
        <Section id="living-universe">
          <SectionTitle>A Living Universe Shaped by Communities</SectionTitle>
          <BodyTextLarge>
            Every realm in the Myth Network is born from a community's identity, culture, and collaborative contributions.
          </BodyTextLarge>
          <BodyText>
            Realms aren't static spaces—they evolve as the community does.
          </BodyText>
          <UnorderedList>
            <ListItem>A new idea becomes a seed.</ListItem>
            <ListItem>A shared creation becomes part of the realm.</ListItem>
            <ListItem>A series of contributions grows a totem.</ListItem>
            <ListItem>A mature totem opens portals to other realms.</ListItem>
          </UnorderedList>
          <BodyText>
            Everything is collectively built, collectively powered, and collectively owned.
          </BodyText>
        </Section>

        {/* Realms: Where Communities Take Shape */}
        <Section id="realms">
          <SectionTitle>Realms: Where Communities Take Shape</SectionTitle>
          <BodyTextLarge>
            A realm is a living world created by a community.
          </BodyTextLarge>
          <BodyText>
            Your realm reflects:
          </BodyText>
          <UnorderedList>
            <ListItem>your collective creativity</ListItem>
            <ListItem>your culture</ListItem>
            <ListItem>your stories</ListItem>
            <ListItem>your challenges</ListItem>
            <ListItem>and the values that shape your tribe</ListItem>
          </UnorderedList>
          <BodyText>
            This is your home world in the Myth Network—your canvas, your sanctuary, and your place to grow.
          </BodyText>
          <BodyText>
            Realms can take many forms:
          </BodyText>
          <RealmExamples>
            <RealmExample>🌿 mystical forests</RealmExample>
            <RealmExample>🔥 volcanic forges</RealmExample>
            <RealmExample>🌀 metaphysical dream worlds</RealmExample>
            <RealmExample>🌙 spiritual, cultural, artistic, or narrative-driven spaces</RealmExample>
          </RealmExamples>
          <BodyText>
            Your realm becomes a mirror of your community's journey.
          </BodyText>
        </Section>

        {/* Totems: The Heart of Collective Power */}
        <Section id="totems">
          <SectionTitle>Totems: The Heart of Collective Power</SectionTitle>
          <BodyTextLarge>
            At the center of every realm stands a totem—a living artifact powered by your community's actions.
          </BodyTextLarge>
          <BodyText>
            Totems grow when your community:
          </BodyText>
          <IconGrid>
            <IconItem>
              <Icon delay={0}>✨</Icon>
              <IconLabel>creates together</IconLabel>
            </IconItem>
            <IconItem>
              <Icon delay={1}>📜</Icon>
              <IconLabel>completes quests</IconLabel>
            </IconItem>
            <IconItem>
              <Icon delay={2}>🎪</Icon>
              <IconLabel>hosts events</IconLabel>
            </IconItem>
            <IconItem>
              <Icon delay={3}>🎨</Icon>
              <IconLabel>collaborates on stories or art</IconLabel>
            </IconItem>
            <IconItem>
              <Icon delay={4}>⚔️</Icon>
              <IconLabel>participates in challenges</IconLabel>
            </IconItem>
            <IconItem>
              <Icon delay={5}>🤝</Icon>
              <IconLabel>supports other realms</IconLabel>
            </IconItem>
          </IconGrid>
          <BodyText>
            Your totem is the pulse of your realm.
          </BodyText>
          <BodyText>
            Its strength unlocks new abilities, opportunities, and pathways across the Myth Network.
          </BodyText>
          <HighlightBox>
            <HighlightText>
              <strong>A strong totem makes your realm a beacon that others can connect to.</strong>
            </HighlightText>
          </HighlightBox>
        </Section>

        {/* Portals: Bridges Between Worlds */}
        <Section id="portals">
          <SectionTitle>Portals: Bridges Between Worlds</SectionTitle>
          <BodyTextLarge>
            When a totem reaches certain thresholds, portals awaken.
          </BodyTextLarge>
          <BodyText>
            Portals allow your community to:
          </BodyText>
          <UnorderedList>
            <ListItem>connect with other realms</ListItem>
            <ListItem>collaborate across worlds</ListItem>
            <ListItem>share challenges, stories, and creations</ListItem>
            <ListItem>traverse the Myth Network</ListItem>
            <ListItem>build alliances and cross-community bonds</ListItem>
          </UnorderedList>
          <BodyText>
            Portals are the connective tissue of the Myth Network.
          </BodyText>
          <HighlightBox>
            <HighlightText>
              <strong>They transform isolated communities into an interconnected ecosystem of creativity, support, and shared growth.</strong>
            </HighlightText>
          </HighlightBox>
        </Section>

        {/* Why the Myth Network Exists */}
        <Section id="why">
          <SectionTitle>Why the Myth Network Exists</SectionTitle>
          <BodyTextLarge>
            The Myth Network is designed to bring people together through:
          </BodyTextLarge>
          <UnorderedList>
            <ListItem>collective imagination</ListItem>
            <ListItem>meaningful collaboration</ListItem>
            <ListItem>shared myth-making</ListItem>
            <ListItem>community-driven storytelling</ListItem>
            <ListItem>cross-world alliances</ListItem>
            <ListItem>gamified engagement</ListItem>
            <ListItem>sovereign digital identity</ListItem>
          </UnorderedList>
          <BodyText>
            It's a way to experience what communities can build when given their own world to shape.
          </BodyText>
          <ContentGrid>
            <Card>
              <CardTitle>Instead of passively consuming content</CardTitle>
              <CardText>
                people create it together.
              </CardText>
            </Card>
            <Card>
              <CardTitle>Instead of being trapped in centralized feeds</CardTitle>
              <CardText>
                communities build sovereign digital realms.
              </CardText>
            </Card>
            <Card>
              <CardTitle>Instead of being disconnected online</CardTitle>
              <CardText>
                we form living networks of worlds that meaningfully support each other.
              </CardText>
            </Card>
          </ContentGrid>
        </Section>

        {/* The Relationship to the Your Land Network */}
        <Section id="your-land">
          <SectionTitle>The Relationship to the Your Land Network</SectionTitle>
          <BodyTextLarge>
            The Myth Network sits inside the broader Your Land Network, a protocol for digital self-sovereignty, community ownership, and creative autonomy.
          </BodyTextLarge>
          <ContentGrid>
            <Card>
              <CardTitle>Your Land Network</CardTitle>
              <CardText>
                is the infrastructure.
              </CardText>
            </Card>
            <Card>
              <CardTitle>Myth Network</CardTitle>
              <CardText>
                is the mythic experience built on top of it.
              </CardText>
            </Card>
          </ContentGrid>
          <BodyText>
            Your Land gives communities their land, identity, and tools.
          </BodyText>
          <BodyText>
            Myth Network turns those tools into worlds, quests, and adventures.
          </BodyText>
        </Section>

        {/* Mystic Island: The First Living Realm */}
        <Section id="mystic-island">
          <SectionTitle>Mystic Island: The First Living Realm</SectionTitle>
          <BodyTextLarge>
            The first official realm of the Myth Network is Mystic Island—a lush, vibrant world shaped by creativity, collaboration, and the spiritual energy of its communities.
          </BodyTextLarge>
          <BodyText>
            Mystic Island acts as:
          </BodyText>
          <ContentGrid>
            <Card>
              <CardTitle>the narrative entry point</CardTitle>
            </Card>
            <Card>
              <CardTitle>the tutorial realm</CardTitle>
            </Card>
            <Card>
              <CardTitle>the gathering place</CardTitle>
            </Card>
            <Card>
              <CardTitle>the first playground for quests and totem-building</CardTitle>
            </Card>
          </ContentGrid>
          <BodyText>
            It is the birthplace of the Myth Network mythos.
          </BodyText>
          <HighlightBox>
            <HighlightText>
              <strong>More realms will emerge as more communities join.</strong>
            </HighlightText>
          </HighlightBox>
        </Section>

        {/* A Universe That Grows With Its People */}
        <Section id="growing-universe">
          <SectionTitle>A Universe That Grows With Its People</SectionTitle>
          <BodyTextLarge>
            The Myth Network is designed to expand as communities do.
          </BodyTextLarge>
          <BodyText>
            Every new realm adds:
          </BodyText>
          <UnorderedList>
            <ListItem>new portals</ListItem>
            <ListItem>new creative styles</ListItem>
            <ListItem>new totem mechanics</ListItem>
            <ListItem>new challenges</ListItem>
            <ListItem>new cultural influences</ListItem>
            <ListItem>new connections</ListItem>
          </UnorderedList>
          <BodyText>
            The universe becomes richer with every participating community.
          </BodyText>
        </Section>

        {/* Join the Myth Network */}
        <Section id="join">
          <SectionTitle>Join the Myth Network</SectionTitle>
          <IntroText>
            Forge your realm.
          </IntroText>
          <IntroText>
            Build your totem.
          </IntroText>
          <IntroText>
            Open your portals.
          </IntroText>
          <IntroText>
            Grow across worlds.
          </IntroText>
          <IntroText style={{ color: colors.sunlitGold, fontWeight: 600, marginTop: 32 }}>
            Your myth begins here.
          </IntroText>
          <ButtonGroup>
            <PrimaryButton href="/">→ Enter the Myth Network</PrimaryButton>
            <PrimaryButton href="/deploy-wallet">→ Explore Mystic Island</PrimaryButton>
          </ButtonGroup>
        </Section>

        {/* Footer */}
        <Footer id="footer">
          <FooterContent>
            <FooterSection>
              <FooterTitle>Resources</FooterTitle>
              <FooterLink href="/">Home</FooterLink>
              <FooterLink href="/about">About</FooterLink>
              <FooterLink
                href="https://github.com/mystic-island"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </FooterLink>
              <FooterLink href="#design-kit">Design Kit</FooterLink>
              <FooterLink href="#press-kit">Press Kit</FooterLink>
            </FooterSection>
            <FooterSection>
              <FooterTitle>Community</FooterTitle>
              <FooterLink
                href="https://discord.gg/mysticisland"
                target="_blank"
                rel="noopener noreferrer"
              >
                Discord
              </FooterLink>
              <FooterLink
                href="https://twitter.com/mysticisland"
                target="_blank"
                rel="noopener noreferrer"
              >
                Twitter
              </FooterLink>
            </FooterSection>
            <FooterSection>
              <FooterTitle>Contact</FooterTitle>
              <FooterLink href="#contact">Contact Us</FooterLink>
              <FooterLink href="#team">Team</FooterLink>
            </FooterSection>
          </FooterContent>
          <FooterBottom>
            <p>© 2024 Mystic Island. All rights reserved.</p>
          </FooterBottom>
        </Footer>
      </PageContainer>
    </>
  );
}

