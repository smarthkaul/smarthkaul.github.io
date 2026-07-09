import Hero from "../components/Hero";
import About from "../components/About";
import Experience from "../components/Experience";
import Projects from "../components/Projects";
import Contact from "../components/Contact";
import Ticker from "../components/broadcast/Ticker";

const TECH = [
  "Python",
  "R",
  "SQL",
  "TensorFlow",
  "Scikit-learn",
  "XGBoost",
  "Time Series",
  "Machine Learning",
  "Data Viz",
  "Statistics",
];

const Home = () => (
  <>
    <Hero />
    <Ticker items={TECH} />
    <About />
    <Experience />
    <Projects />
    <Contact />
  </>
);

export default Home;
