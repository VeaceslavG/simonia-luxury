import { benefitsData } from "./benefitsData";
import "./benefits.scss";

export default function Benefits() {
  return (
    <div className="container benefitsContainer">
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {benefitsData.map((benefit) => (
          <div key={benefit.id} className="col">
            <div className="card h-100 benefitCard p-3 border-0">
              <div className="d-flex align-items-center mb-3 benefitTitle">
                <img
                  className="benefitIcon me-3"
                  src={benefit.title.icon}
                  alt={benefit.title.text}
                />
                <span className="benefitTitleText">{benefit.title.text}</span>
              </div>
              <p className="benefitDescription">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
