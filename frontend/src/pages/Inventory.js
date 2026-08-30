import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form, Modal, Badge, InputGroup, Tab, Tabs } from 'react-bootstrap';
import { inventoryAPI, warehousesAPI, productsAPI } from '../services/api';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [activeTab, setActiveTab] = useState('inventory');
  const [formData, setFormData] = useState({
    warehouse_id: '',
    product_id: '',
    variant_id: '',
    quantity: '',
  });

  useEffect(() => {
    fetchData();
    fetchWarehouses();
    fetchProducts();
  }, [selectedWarehouse]);

  const fetchData = async () => {
    try {
      const params = {};
      if (selectedWarehouse) params.warehouse_id = selectedWarehouse;
      
      const [inventoryRes, movementsRes] = await Promise.all([
        inventoryAPI.getAll(params),
        inventoryAPI.getMovements(params),
      ]);
      
      setInventory(inventoryRes.data.data);
      setMovements(movementsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await warehousesAPI.getAll();
      setWarehouses(response.data.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleShowModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        warehouse_id: item.warehouse_id,
        product_id: item.product_id,
        variant_id: item.variant_id || '',
        quantity: item.quantity,
      });
    } else {
      setEditingItem(null);
      setFormData({
        warehouse_id: '',
        product_id: '',
        variant_id: '',
        quantity: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
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
      if (editingItem) {
        await inventoryAPI.update(editingItem.inventory_id, formData);
      } else {
        await inventoryAPI.create(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving inventory:', error);
    }
  };

  const handleDelete = async (inventoryId) => {
    if (window.confirm('Are you sure you want to delete this inventory record?')) {
      try {
        await inventoryAPI.delete(inventoryId);
        fetchData();
      } catch (error) {
        console.error('Error deleting inventory:', error);
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
          <h1>Inventory Management</h1>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => handleShowModal()}>
            Add Inventory
          </Button>
        </Col>
      </Row>

      {/* Warehouse Filter */}
      <Row className="mb-4">
        <Col md={4}>
          <Form.Select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
          >
            <option value="">All Warehouses</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                {warehouse.warehouse_name}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="inventory" title="Current Inventory">
          <Card>
            <Card.Body>
              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Warehouse</th>
                    <th>Quantity</th>
                    <th>Min. Quantity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.inventory_id}>
                      <td>
                        <div>
                          <strong>{item.product?.product_name}</strong>
                          {item.variant && (
                            <div className="text-muted small">{item.variant.variant_name}</div>
                          )}
                        </div>
                      </td>
                      <td>{item.product?.sku}</td>
                      <td>{item.warehouse?.warehouse_name}</td>
                      <td>
                        <span className={item.quantity <= item.product?.minimum_quantity ? 'low-stock' : ''}>
                          {item.quantity}
                        </span>
                      </td>
                      <td>{item.product?.minimum_quantity}</td>
                      <td>
                        {item.quantity <= item.product?.minimum_quantity ? (
                          <Badge bg="danger">Low Stock</Badge>
                        ) : item.quantity === 0 ? (
                          <Badge bg="warning">Out of Stock</Badge>
                        ) : (
                          <Badge bg="success">In Stock</Badge>
                        )}
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleShowModal(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(item.inventory_id)}
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
        </Tab>

        <Tab eventKey="movements" title="Inventory Movements">
          <Card>
            <Card.Body>
              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Warehouse</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Value</th>
                    <th>User</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr key={movement.transaction_id}>
                      <td>{new Date(movement.transaction_date).toLocaleDateString()}</td>
                      <td>{movement.product?.product_name}</td>
                      <td>{movement.warehouse?.warehouse_name}</td>
                      <td>
                        <Badge bg={movement.transaction_type?.type_name === 'inbound' ? 'success' : 'primary'}>
                          {movement.transaction_type?.type_name}
                        </Badge>
                      </td>
                      <td>
                        <span className={movement.quantity > 0 ? 'text-success' : 'text-danger'}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </span>
                      </td>
                      <td>${movement.transaction_value}</td>
                      <td>{movement.user?.name}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Inventory Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingItem ? 'Edit Inventory' : 'Add Inventory'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Warehouse *</Form.Label>
              <Form.Select
                name="warehouse_id"
                value={formData.warehouse_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                    {warehouse.warehouse_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Product *</Form.Label>
              <Form.Select
                name="product_id"
                value={formData.product_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Product</option>
                {products.map((product) => (
                  <option key={product.product_id} value={product.product_id}>
                    {product.product_name} ({product.sku})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Quantity *</Form.Label>
              <Form.Control
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="0"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingItem ? 'Update' : 'Create'} Inventory
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Inventory;