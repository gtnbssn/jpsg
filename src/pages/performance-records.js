import * as React from "react"
import { Container, Row, Col, Jumbotron } from "react-bootstrap"
import { useEffect, useState } from "react"
import { GatsbyImage } from "gatsby-plugin-image"
import LineGraph from "../components/LineGraph/LineGraph.js"

import EventList from "../components/EventList/EventList.js"

import Layout from "../components/Layout/Layout.js"
import Seo from "../components/seo"
import { graphql } from "gatsby"

import { Map, Marker, Draggable } from "pigeon-maps"
import "./performance-records.scss"

const Page2 = ({
  data: {
    page: {
      name,
      cover,
      description,
      childMarkdownRemark: { html },
    },
    chartData,
    lineData,
  },
}) => {
  const eventDetails = chartData.nodes
  const eventList = []
  const mapData = []
  const pageTitle = name.split("_").pop()
  const years = []
  const newData = []
  const [selectedYear, setSelectedYear] = React.useState(null)
  const [selectedNode, setSelectedeNode] = React.useState(null)

  const [selectedTime, setSelectedTime] = React.useState(null)
  const [anchor, setAnchor] = useState([1.3521, 103.8198])

  useEffect(() => {}, [selectedTime, selectedNode])

  const handleClickMap = node => {
    if (selectedNode === node && selectedTime === node.Time) {
      setSelectedTime(null)
      setSelectedeNode(null)
      setAnchor([1.3521, 103.8198])
    } else {
      setSelectedeNode(node)
      setSelectedTime(node.Time)
      setAnchor([parseFloat(node.Latitude), parseFloat(node.Longtitude)])
    }
  }

  const eventByYear = {}
  for (var i in lineData.nodes) {
    var curr_event = lineData.nodes[i]
    eventByYear[curr_event["Year"]] = curr_event["Event"]
  }

  if (selectedNode && selectedTime) {
    eventDetails.map(event => {
      if (event === selectedNode && event.Time === selectedTime) {
        eventList.push(event)
      }
      if (selectedYear && event.Date.slice(0, 4) === selectedYear) {
        mapData.push(event)
      } else if (!selectedYear) {
        mapData.push(event)
      }
      var year = event.Date.slice(0, 4)
      if (!years.includes(year)) {
        years.push(year)
        newData.push({
          year: year,
          value: 1,
        })
      } else {
        for (var data of newData) {
          if (data.year === year) {
            data.value += 1
          }
        }
      }
      return newData
    })
  } else {
    eventDetails.map(event => {
      if (selectedYear && event.Date.slice(0, 4) === selectedYear) {
        eventList.push(event)
        mapData.push(event)
      } else if (!selectedYear) {
        eventList.push(event)
        mapData.push(event)
      }

      var year = event.Date.slice(0, 4)
      if (!years.includes(year)) {
        years.push(year)
        if (eventByYear[String(year)] != null) {
          newData.push({
            year: year,
            value: 1,
            Event: eventByYear[String(year)],
          })
        } else {
          newData.push({
            year: year,
            value: 1,
            Event: null,
          })
        }
      } else {
        for (var data of newData) {
          if (data.year === year) {
            data.value += 1
          }
        }
      }
      return newData
    })
  }
  console.log(newData)

  newData.sort(function (a, b) {
    var keyA = Number(a.year),
      keyB = Number(a.year)
    // Compare the 2 years
    if (keyA < keyB) return -1
    if (keyA > keyB) return 1
    return 0
  })
  return (
    <Layout>
      <Seo title={pageTitle} />
      {cover && (
          <GatsbyImage
            image={cover.image.childImageSharp.gatsbyImageData}
            alt={cover.alt}
            title={cover.title}
            style={{
              height: `500px`,
              display: `flex`,
              justifyContent: `center`,
              marginBottom: `15px`,
            }}
            imgStyle={{ objectPosition: "0px" }}
          />
        )}
      <Jumbotron style={{ backgroundColor: "#F2F4F8", padding: `0` }}>
        <h1
          style={{
            justifyContent: "center",
            height: "130px",
            display: "flex",
            alignItems: "center",
          }}
        >
          Japanese Performances in Singapore, 1893-2020
        </h1>
      </Jumbotron>
      <Container>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </Container>
      <Container>
        <LineGraph
          data={newData}
          title={"Number of Performances"}
          xaxis={"year"}
          yaxis={"value"}
          click={setSelectedYear}
        />

        <Row>
          <Col>
            <Map
              className="map"
              height={500}
              defaultCenter={[1.3521, 103.8198]}
              defaultZoom={11}
            >
              {selectedNode != null && (
                <Draggable
                  offset={[-150, 100]}
                  anchor={anchor}
                  onDragEnd={setAnchor}
                >
                  <Container className="popup">
                    <p className="popupBox">Drag and Drop</p>
                    <p className="popupTitle">Performace Title: </p>
                    <p className="popupTitleText">
                      {selectedNode.Performance_Title}
                    </p>
                    <p className="popupTitle">Genre: </p>
                    <p>{selectedNode.Genres_concatenated}</p>

                    <p className="popupTitle">Date: </p>
                    <p>{selectedNode.Date}</p>
                    <p className="popupTitle">Time: </p>
                    <p>{selectedNode.Time}</p>

                  </Container>
                </Draggable>
              )}

              {mapData.map(node => {
                const lat = node.Latitude ? parseFloat(node.Latitude) : null
                const long = node.Longtitude
                  ? parseFloat(node.Longtitude)
                  : null

                return (
                  <Marker
                    className="marker"
                    width={50}
                    anchor={[lat, long]}
                    onClick={() => {
                      handleClickMap(node)
                    }}
                  />
                )
              })}
            </Map>
          </Col>

          <EventList
            className="eventlist"
            data={eventList}
            attribute={["Performance_Title", "Genres_concatenated", "Date"]}
          ></EventList>
        </Row>
      </Container>
    </Layout>
  )
}

export default Page2

export const data = graphql`
  query PerformanceRecords {
    page: googleDocs(slug: { eq: "/performance-records" }) {
      name
      description
      cover {
        alt
        title
        image {
          childImageSharp {
            gatsbyImageData(placeholder: BLURRED, formats: [AUTO, WEBP, AVIF])
          }
        }
      }
      childMarkdownRemark {
        html
      }
    }

    chartData: allJpsgCsv {
      distinct(field: Genres_concatenated)
      nodes {
        Date
        English_name_of_performing_troupes__performers_concatenated
        Genres_concatenated
        Performance_Title
        Time
        Venue_concatenated
        Latitude
        Longtitude
      }
      two: group(field: Performance_types_concatenated) {
        fieldValue
        totalCount
        nodes {
          Genres_concatenated
        }
      }
    }

    lineData: allHistoricalContextCsv {
      nodes {
        Event
        Notes
        Type
        Year
      }
    }
  }
`
