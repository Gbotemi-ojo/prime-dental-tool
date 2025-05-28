import Select from 'react-select';
import { products } from '../utils/products';

const options = [
  { value: "analgesic", label: "ANALGESIC" },
  { value: "analgesic (opioid)", label: "ANALGESIC (OPIOID)" },
  { value: "antacid", label: "ANTACID" },
  { value: "antifungal", label: "ANTI FUNGAL" },
  { value: "antihypertensive", label: "ANTI HYPERTENSIVE" },
  { value: "anti-inflammatory steroid", label: "ANTI-INFLAMMATORY STEROID" },
  { value: "anti-schizophrenic", label: "ANTI-SCHIZOPHRENIC" },
  { value: "anti-spasmodic", label: "ANTI-SPASMODIC" },
  { value: "anti-ulcer", label: "ANTI-ULCER" },
  { value: "anti-vertigo", label: "ANTI-VERTIGO" },
  { value: "antiarthritic", label: "ANTIARTHRITIC" },
  { value: "antibiotics", label: "ANTIBIOTICS" },
  { value: "antibleeding", label: "ANTIBLEEDING" },
  { value: "anticholesterol", label: "ANTICHOLESTEROL" },
  { value: "anticoagulant", label: "ANTICOAGULANT" },
  { value: "anticonstipation", label: "ANTICONSTIPATION" },
  { value: "anticonvulsant", label: "ANTICONVULSANT" },
  { value: "antidepressant", label: "ANTIDEPRESSANT" },
  { value: "antidiabetic", label: "ANTIDIABETIC" },
  { value: "antidiarrhoeal", label: "ANTIDIARRHOEAL" },
  { value: "antiemetic", label: "ANTIEMETIC" },
  { value: "antifungal", label: "ANTIFUNGAL" },
  { value: "antigout", label: "ANTIGOUT" },
  { value: "antihemorrhoids", label: "ANTIHEMORRHOIDS" },
  { value: "antihistamine", label: "ANTIHISTAMINE" },
  { value: "antihypertensive", label: "ANTIHYPERTENSIVE" },
  { value: "antimalarial", label: "ANTIMALARIAL" },
  { value: "antioxidant", label: "ANTIOXIDANT" },
  { value: "antiprostate", label: "ANTIPROSTATE" },
  { value: "antiseptics", label: "ANTISEPTICS" },
  { value: "antithyroid", label: "ANTITHYROID" },
  { value: "antiviral", label: "ANTIVIRAL" },
  { value: "aphrodisiacs & sex", label: "APHRODISIACS & SEX" },
  { value: "appetite inducer", label: "APPETITE INDUCER" },
  { value: "battery", label: "BATTERY" },
  { value: "beverages", label: "BEVERAGES" },
  { value: "bronchodilator", label: "BRONCHODILATOR" },
  { value: "cns drugs", label: "CNS DRUGS" },
  { value: "confectioneries", label: "CONFECTIONERIES" },
  { value: "cosmetics", label: "COSMETICS" },
  { value: "cough, cold & flu", label: "COUGH, COLD & FLU" },
  { value: "creams", label: "CREAMS" },
  { value: "diagnostics", label: "DIAGNOSTICS" },
  { value: "diet", label: "DIET" },
  { value: "diuretics", label: "DIURETICS" },
  { value: "drinks", label: "DRINKS" },
  { value: "drugs", label: "DRUGS" },
  { value: "eye antioxidants", label: "EYE ANTIOXIDANTS" },
  { value: "eye/ear drops", label: "EYE/EAR DROPS" },
  { value: "fertility", label: "FERTILITY" },
  { value: "grocery", label: "GROCERY" },
  { value: "haematinic", label: "HAEMATINIC" },
  { value: "infusion", label: "INFUSION" },
  { value: "injectables", label: "INJECTABLES" },
  { value: "insecticide", label: "INSECTICIDE" },
  { value: "laxative", label: "LAXATIVE" },
  { value: "lozenges", label: "LOZENGES" },
  { value: "lubricant", label: "LUBRICANT" },
  { value: "medical device", label: "MEDICAL DEVICE" },
  { value: "medical diagnostics", label: "MEDICAL DIAGNOSTICS" },
  { value: "medical machine", label: "MEDICAL MACHINE" },
  { value: "medical support", label: "MEDICAL SUPPORT" },
  { value: "medical surgicals & disposables", label: "MEDICAL SURGICALS & DISPOSABLES" },
  { value: "multivitamins", label: "MULTIVITAMINS" },
  { value: "nasal drop", label: "NASAL DROP" },
  { value: "perfume", label: "PERFUME" },
  { value: "pessaries", label: "PESSARIES" },
  { value: "prescription drug", label: "PRESCRIPTION DRUG" },
  { value: "provision", label: "PROVISION" },
  { value: "sleep inducer", label: "SLEEP INDUCER" },
  { value: "soap", label: "SOAP" },
  { value: "supplements", label: "SUPPLEMENTS" },
  { value: "support", label: "SUPPORT" },
  { value: "suppositories", label: "SUPPOSITORIES" },
  { value: "surgicals", label: "SURGICALS" },
  { value: "syrup", label: "SYRUP" },
  { value: "system", label: "System" },
  { value: "toiletries", label: "TOILETRIES" },
  { value: "topicals", label: "TOPICALS" },
  { value: "ulcer", label: "ULCER" },
  { value: "wines", label: "WINES" },
  { value: "worm expeller", label: "WORM EXPELLER" },
  { value: "wound dressing", label: "WOUND DRESSING" },
];


const customStyles = {
    control: (provided) => ({
        ...provided,
        backgroundColor: "#0f3460",
        color: "white",
        borderRadius: "5px",
        border: "none",
        boxShadow: "none",
        width: "200px",
        height: "40px",
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? "#0f3460" : "white",
        color: state.isSelected ? "white" : "#0f3460",
        "&:hover": {
        backgroundColor: "#0f3460",
        color: "white",
        },
    }),
    singleValue: (provided) => ({
        ...provided,
        color: "white",
    }),
};

const FilterSelect = ({setFilterList}) => {
    const handleChange = (selectedOption)=> {
        setFilterList(products.filter(item => item.category ===selectedOption.value))
    }
    return (
    <Select
    options={options}
    defaultValue={{ value: "", label: "Filter By Category" }}
    styles={customStyles}
    onChange={handleChange}
    />
    );
};

export default FilterSelect;
