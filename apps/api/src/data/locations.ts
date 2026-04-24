export type LagosLocation = {
  id: string;
  name: string;
  aliases: string[];
  description: string;
};

export const LAGOS_LOCATIONS: LagosLocation[] = [
  { id: "ajah", name: "Ajah", aliases: ["Ajah Junction", "Abraham Adesanya"], description: "Residential hub at the end of Lekki-Epe Expressway, popular for its large market and bus terminus." },
  { id: "badagry", name: "Badagry", aliases: ["Badagry Town"], description: "Historic coastal town on the Lagos-Benin border, known for its slave heritage museums and beaches." },
  { id: "berger", name: "Berger", aliases: ["Ojodu Berger", "Berger Bus Stop"], description: "Major interchange on the Lagos-Ibadan Expressway, one of the busiest bus stops for intercity travel." },
  { id: "cms", name: "CMS", aliases: ["Church Mission Street", "Lagos CMS", "Marina"], description: "Commercial heart of Lagos Island along the marina waterfront, named after Church Mission Society." },
  { id: "festac", name: "Festac", aliases: ["Festac Town", "2nd Avenue"], description: "Planned estate built for the 1977 FESTAC festival, with wide streets and a grid layout." },
  { id: "gbagada", name: "Gbagada", aliases: ["Gbagada Phase 1", "Gbagada Phase 2"], description: "Middle-class residential area with good road access to the mainland and island." },
  { id: "ikeja", name: "Ikeja", aliases: ["Ikeja CBD", "Computer Village", "Allen Avenue"], description: "Capital of Lagos State and major commercial district, home to the airport and Computer Village tech market." },
  { id: "ikorodu", name: "Ikorodu", aliases: ["Ikorodu Town", "Owutu"], description: "Fast-growing satellite town in northern Lagos, connected to the mainland by ferry and road." },
  { id: "ikoyi", name: "Ikoyi", aliases: ["Old Ikoyi", "Parkview", "Bourdillon"], description: "Upscale residential island neighbourhood known for embassies, high-end homes, and waterfront estates." },
  { id: "isale_eko", name: "Isale Eko", aliases: ["Lagos Island Central", "Campos"], description: "The original Lagos settlement, densely populated historic core of Lagos Island." },
  { id: "ketu", name: "Ketu", aliases: ["Alapere", "Mile 12"], description: "Northern mainland area adjacent to Mile 12 market, one of West Africa's largest produce markets." },
  { id: "lagos_island", name: "Lagos Island", aliases: ["Island", "Eko"], description: "The original commercial island of Lagos, containing the CBD, markets, and financial institutions." },
  { id: "lekki", name: "Lekki", aliases: ["Lekki Phase 1", "Lekki Phase 2", "Lekki-Epe Expressway"], description: "Rapidly developing peninsula east of VI with residential estates, malls, and the Lekki Free Trade Zone." },
  { id: "magodo", name: "Magodo", aliases: ["Magodo Phase 1", "Magodo Phase 2"], description: "Quiet residential estate in Kosofe known for its orderly layout and family neighbourhoods." },
  { id: "maryland", name: "Maryland", aliases: ["Maryland Mall", "Mobolaji Bank Anthony Way"], description: "Central mainland district connecting Ikeja and Ikorodu Road, anchored by Maryland Mall." },
  { id: "mile2", name: "Mile 2", aliases: ["Mile Two", "Ojo Road"], description: "Major transit hub on the Lagos-Badagry Expressway serving Festac, Apapa, and Ojo commuters." },
  { id: "ojota", name: "Ojota", aliases: ["Ojota Bus Stop", "New Garage"], description: "Busy interchange at the northern edge of the Lagos-Ibadan Expressway junction." },
  { id: "ojuelegba", name: "Ojuelegba", aliases: ["Tejuosho", "Western Avenue"], description: "Central mainland junction connecting Surulere, Yaba, and Lagos Island routes." },
  { id: "oshodi", name: "Oshodi", aliases: ["Oshodi Market", "Oshodi Interchange"], description: "One of Lagos's most essential transport interchanges, linking all mainland axes." },
  { id: "surulere", name: "Surulere", aliases: ["Aguda", "Ojuelegba", "National Stadium"], description: "Dense residential and commercial area home to the National Stadium and Tejuosho market." },
  { id: "tbs", name: "TBS", aliases: ["Tafawa Balewa Square", "Race Course", "Lagos Island"], description: "Historic Lagos Island square and events venue, former colonial race course near the marina." },
  { id: "vi", name: "Victoria Island", aliases: ["VI", "Victoria Island", "Eti-Osa"], description: "Premier business and nightlife district in Lagos, home to corporate headquarters and upscale restaurants." },
  { id: "yaba", name: "Yaba", aliases: ["Sabo", "Yaba Tech", "Herbert Macaulay Way"], description: "Lagos tech hub and university district, home to UNILAG, YabaCon, and a vibrant startup scene." },
  { id: "apapa", name: "Apapa", aliases: ["Apapa Wharf", "Creek Road"], description: "Industrial port area managing most of Nigeria's sea freight, known for severe traffic congestion." },
  { id: "shomolu", name: "Shomolu", aliases: ["Somolu", "Bariga"], description: "Working-class mainland area known for its printing trade and proximity to Bariga." },
  { id: "mushin", name: "Mushin", aliases: ["Idi-Oro", "Mushin Market"], description: "Dense, vibrant mainland neighbourhood, a major commercial and transport corridor." },
  { id: "agege", name: "Agege", aliases: ["Agege Stadium", "Dopemu"], description: "Northern mainland area known for its bakeries, stadium, and busy Dopemu interchange." },
  { id: "anthony", name: "Anthony Village", aliases: ["Anthony", "Bank Anthony"], description: "Residential suburb between Maryland and Palmgrove, named after Anthony Enahoro." },
  { id: "onikan", name: "Onikan", aliases: ["Onikan Stadium", "Lagos Island South"], description: "Quiet southern part of Lagos Island with the national museum, stadium, and old residential streets." },
];
