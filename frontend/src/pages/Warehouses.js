import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form, Modal, InputGroup } from 'react-bootstrap';
import { warehousesAPI, getCollection } from '../services/api';

const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    warehouse_name: '',
    location: '',
  });

  useEffect(() => {
    fetchWarehouses();
  }, [searchTerm]);

  const fetchWarehouses = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;

      const response = await warehousesAPI.getAll(params);
      setWarehouses(getCollection(response));
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (warehouse = null) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        warehouse_name: warehouse.warehouse_name,
        location: warehouse.location || '',
      });
    } else {
      setEditingWarehouse(null);
      setFormData({
        warehouse_name: '',
        location: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingWarehouse(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingWarehouse) {
        await warehousesAPI.update(editingWarehouse.warehouse_id, formData);
      } else {
        await warehousesAPI.create(formData);
      }
      handleCloseModal();
      fetchWarehouses();
    } catch (error) {
      console.error('Error saving warehouse:', error);
    }
  };

  const handleDelete = async (warehouseId) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      try {
        await warehousesAPI.delete(warehouseId);
        fetchWarehouses();
      } catch (error) {
        console.error('Error deleting warehouse:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h1>Warehouses</h1>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => handleShowModal()}>
            Add Warehouse
          </Button>
        </Col>
      </Row>

      {/* Search */}
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search warehouses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          <Table striped hover responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Inventory Items</th>
                <th>Inbound Orders</th>
                <th>Outbound Orders</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((warehouse) => (
                <tr key={warehouse.warehouse_id}>
                  <td>
                    <strong>{warehouse.warehouse_name}</strong>
                  </td>
                  <td>{warehouse.location}</td>
                  <td>{warehouse.inventory_count || 0}</td>
                  <td>{warehouse.inbound_orders_count || 0}</td>
                  <td>{warehouse.outbound_orders_count || 0}</td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleShowModal(warehouse)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(warehouse.warehouse_id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Warehouse Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Warehouse Name *</Form.Label>
              <Form.Control
                type="text"
                name="warehouse_name"
                value={formData.warehouse_name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingWarehouse ? 'Update' : 'Create'} Warehouse
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Warehouses;