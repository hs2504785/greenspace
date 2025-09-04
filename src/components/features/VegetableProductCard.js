"use client";

import VegetableCard from "./VegetableCard";
import PreBookingProductCard from "./PreBooking/PreBookingProductCard";

/**
 * Smart wrapper component that renders the appropriate card type
 * based on the product_type field (regular vs prebooking)
 */
export default function VegetableProductCard(props) {
  const isPreBookingProduct = props.product_type === "prebooking";

  if (isPreBookingProduct) {
    return (
      <PreBookingProductCard
        id={props.id}
        name={props.name}
        images={props.images}
        price={props.price}
        owner={props.owner}
        owner_id={props.owner_id}
        location={props.owner?.location || props.location}
        category={props.category}
        estimated_available_date={props.estimated_available_date}
        harvest_season={props.harvest_season}
        min_order_quantity={props.min_order_quantity}
        unit={props.unit}
        seller_confidence={props.seller_confidence}
        prebooking_notes={props.prebooking_notes}
        // Include any demand analytics if available
        demand_level={props.demand_level}
        total_prebookings={props.total_prebookings}
        interested_customers={props.interested_customers}
      />
    );
  }

  // Regular product - use existing VegetableCard
  return (
    <VegetableCard
      id={props.id}
      name={props.name}
      images={props.images}
      price={props.price}
      owner={props.owner}
      owner_id={props.owner_id}
      location={props.owner?.location || props.location}
      quantity={props.quantity}
      unit={props.unit}
      category={props.category}
    />
  );
}
