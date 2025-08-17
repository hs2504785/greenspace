import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Container, Row, Col } from "react-bootstrap";
import VegetableManagement from "@/components/features/products/VegetableManagement";

export default async function ProductsManagementPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <Container className="pb-4">
      <Row>
        <Col>
          <h1 className="mb-4">
            <i className="ti-package me-2"></i>
            My Products
          </h1>
          <VegetableManagement />
        </Col>
      </Row>
    </Container>
  );
}
